from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clients.fdoh_client import FdohClient
from app.config import get_settings
from app.models.entities import LaunchScore, Ramp, User
from app.schemas.chat import (
    ChatBestWindow,
    ChatIntent,
    ChatRecommendationRequest,
    ChatRecommendationResponse,
    ChatSourceCard,
    ChatSpotRecommendation,
)
from app.services.openai_service import generate_chat_recommendation_text
from app.services.ramp_service import get_launch_windows, get_ramp_conditions, list_ramps
from app.services.source_sync import refresh_ramp_sources


DISCLAIMER = (
    "rampready is a planning and awareness tool only. It is not a navigation tool, not an "
    "emergency service, and not a substitute for official marine forecasts, nautical charts, "
    "local knowledge, or safe boating judgment. Weather, tide, water-level, current, buoy, "
    "water-quality, and ramp information may be delayed, incomplete, preliminary, or inaccurate. "
    "Always check official NOAA/NWS/FWC/FDOH sources and local conditions before launching."
)

FWC_REGULATIONS_SOURCE = ChatSourceCard(
    name="FWC Saltwater Recreational Fishing Regulations",
    provider="Florida Fish and Wildlife Conservation Commission",
    url="https://myfwc.com/fishing/saltwater/recreational/",
    status="supplemental",
    notes=[
        "Use this official FWC source to verify seasons, size limits, bag limits, licenses, and closures."
    ],
)


def infer_intent(message: str, explicit: ChatIntent | None = None) -> ChatIntent:
    if explicit:
        return explicit
    lower = message.lower()
    fishing_terms = {"fish", "fishing", "bite", "bait", "species", "catch", "angling"}
    boating_terms = {"boat", "boating", "launch", "ramp", "water", "waves", "wind"}
    has_fishing = any(term in lower for term in fishing_terms)
    has_boating = any(term in lower for term in boating_terms)
    if has_fishing and not has_boating:
        return "fishing"
    if has_boating and not has_fishing:
        return "boating"
    return "both"


def _freshness_minutes(dt: datetime | None) -> int | None:
    if not dt:
        return None
    dt_utc = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return int((datetime.now(timezone.utc) - dt_utc.astimezone(timezone.utc)).total_seconds() // 60)


def _source_card_from_summary(name: str, provider: str, summary: dict[str, Any]) -> ChatSourceCard:
    updated_raw = summary.get("updated_at") or summary.get("observed_at") or summary.get("checked_at")
    updated_at = None
    if isinstance(updated_raw, str):
        try:
            updated_at = datetime.fromisoformat(updated_raw.replace("Z", "+00:00"))
        except ValueError:
            updated_at = None
    freshness = summary.get("freshness_minutes")
    if freshness is None:
        freshness = _freshness_minutes(updated_at)
    status = "ok"
    notes: list[str] = []
    if updated_at is None and "alerts" not in name.lower():
        status = "missing"
        notes.append("No current timestamp was available from this source.")
    elif freshness is not None and freshness > 180:
        status = "stale"
        notes.append("This source may be stale for day-of planning.")
    return ChatSourceCard(
        name=name,
        provider=provider,
        updated_at=updated_at,
        freshness_minutes=freshness,
        status=status,  # type: ignore[arg-type]
        notes=notes,
    )


def _best_window(windows: list[LaunchScore]) -> LaunchScore | None:
    if not windows:
        return None
    color_rank = {"green": 4, "yellow": 3, "gray": 2, "red": 1}
    now = datetime.now(timezone.utc)
    future = [
        window
        for window in windows
        if (window.ends_at if window.ends_at.tzinfo else window.ends_at.replace(tzinfo=timezone.utc))
        >= now
    ]
    pool = future or windows
    return max(
        pool,
        key=lambda w: (
            color_rank.get(w.color, 0),
            int(w.confidence_score or 0),
            float(w.score or 0),
            -abs(
                (
                    (w.starts_at if w.starts_at.tzinfo else w.starts_at.replace(tzinfo=timezone.utc))
                    - now
                ).total_seconds()
            ),
        ),
    )


def _rank_fit_score(ramp: Ramp, window: LaunchScore | None, intent: ChatIntent) -> float:
    if not window:
        return max(0.0, float(ramp.confidence_score or 0) * 0.2)
    color_points = {"green": 100.0, "yellow": 70.0, "gray": 35.0, "red": 5.0}
    score = color_points.get(window.color, 0.0)
    score += float(window.confidence_score or 0) * 0.35
    score += min(float(ramp.confidence_score or 0), 100.0) * 0.15
    if ramp.manually_verified_at:
        score += 5.0
    if intent in {"fishing", "both"}:
        if ramp.bait_nearby:
            score += 6.0
        if ramp.parking:
            score += 2.0
        if ramp.restrooms:
            score += 2.0
        if ramp.kayak_friendly:
            score += 2.0
    if window.color == "red":
        score -= 70.0
    return round(max(0.0, min(score, 150.0)), 2)


def _ramp_notes(ramp: Ramp, intent: ChatIntent) -> tuple[list[str], list[str], list[str]]:
    boating_notes: list[str] = []
    fishing_notes: list[str] = []
    missing: list[str] = []

    if ramp.local_hazards:
        boating_notes.append(f"Local hazard note: {ramp.local_hazards}")
    if ramp.hours:
        boating_notes.append(f"Ramp hours: {ramp.hours}")
    if ramp.parking:
        boating_notes.append(f"Parking: {ramp.parking}")
    if ramp.fee:
        boating_notes.append(f"Fee: {ramp.fee}")
    if ramp.confidence_score < 60:
        missing.append("Ramp metadata confidence is low; verify access locally before towing.")
    if intent in {"fishing", "both"}:
        if ramp.bait_nearby:
            fishing_notes.append("Ramp metadata indicates bait may be nearby.")
        else:
            missing.append("Nearby bait availability is not confirmed in ramp metadata.")
        fishing_notes.append(
            "Use this as an access/conditions pick only; rampready does not predict fish activity."
        )
        fishing_notes.append("Verify current FWC seasons, size limits, bag limits, and licenses.")
    return boating_notes, fishing_notes, missing


class ChatRecommendationService:
    async def recommend_async(
        self, db: Session, user: User, request: ChatRecommendationRequest
    ) -> ChatRecommendationResponse:
        settings = get_settings()
        intent = infer_intent(request.message, request.intent)
        limit = request.candidate_limit or settings.chat_candidate_limit
        region = request.region or (user.profile.home_region if user.profile else None) or "FL"
        candidates = list_ramps(
            db,
            region=region,
            q=None,
            near_lat=request.near_lat,
            near_lon=request.near_lon,
            limit=limit,
        )
        if not candidates:
            candidates = list(db.scalars(select(Ramp).order_by(Ramp.name.asc()).limit(limit)))

        recommendations: list[ChatSpotRecommendation] = []
        global_sources: dict[tuple[str, str], ChatSourceCard] = {}
        warnings = [
            "Recommendations are rampready planning guidance, not official government recommendations.",
        ]
        if intent in {"fishing", "both"}:
            warnings.append(
                "Fishing notes are about access and conditions only; verify current FWC rules and closures."
            )
            global_sources[(FWC_REGULATIONS_SOURCE.provider, FWC_REGULATIONS_SOURCE.name)] = (
                FWC_REGULATIONS_SOURCE
            )

        for ramp in candidates:
            try:
                refresh_ramp_sources(db, ramp, use_fixture=settings.app_env == "test")
            except Exception:
                warnings.append(f"Some live source refreshes failed for {ramp.name}; cached data was used.")

            windows = get_launch_windows(
                db,
                ramp_id=ramp.id,
                profile_id=user.profile.id if user.profile else None,
                days=1,
                force_recompute=True,
            )
            if not windows:
                windows = get_launch_windows(
                    db,
                    ramp_id=ramp.id,
                    profile_id=None,
                    days=1,
                    force_recompute=True,
                )
            best = _best_window(windows)
            boating_notes, fishing_notes, missing_data = _ramp_notes(ramp, intent)
            source_cards = self._build_source_cards(best)
            if intent in {"fishing", "both"}:
                source_cards.append(FWC_REGULATIONS_SOURCE)
                fdoh_card = await self._water_quality_card(ramp)
                source_cards.append(fdoh_card)
                if fdoh_card.status in {"missing", "error"}:
                    missing_data.append("Nearby beach/water-quality sampling data was not available.")
            if not best:
                missing_data.append("No launch-window score was available for this ramp.")
            elif best.color == "gray":
                missing_data.append("Critical forecast or observation data is incomplete for this window.")

            for card in source_cards:
                global_sources[(card.provider, card.name)] = card

            rec = ChatSpotRecommendation(
                ramp_id=ramp.id,
                name=ramp.name,
                city=ramp.city,
                state=ramp.state,
                latitude=float(ramp.latitude),
                longitude=float(ramp.longitude),
                rank=0,
                fit_score=_rank_fit_score(ramp, best, intent),
                launch_color=(best.color if best else "gray"),  # type: ignore[arg-type]
                confidence_score=int(best.confidence_score if best else ramp.confidence_score),
                best_window=(
                    ChatBestWindow(
                        starts_at=best.starts_at,
                        ends_at=best.ends_at,
                        color=best.color,
                        score=float(best.score),
                        confidence_score=best.confidence_score,
                    )
                    if best
                    else None
                ),
                top_reasons=(best.reasons[:3] if best else []),
                boating_notes=boating_notes,
                fishing_notes=fishing_notes,
                source_cards=source_cards,
                missing_data=missing_data,
            )
            recommendations.append(rec)

        recommendations.sort(key=lambda rec: rec.fit_score, reverse=True)
        for idx, rec in enumerate(recommendations, start=1):
            rec.rank = idx

        context = {
            "user_message": request.message,
            "intent": intent,
            "warnings": warnings,
            "recommendations": [
                rec.model_dump(mode="json", exclude={"source_cards"}) for rec in recommendations
            ],
            "sources": [
                card.model_dump(mode="json")
                for card in sorted(global_sources.values(), key=lambda c: (c.provider, c.name))
            ],
            "disclaimer": DISCLAIMER,
        }
        summary = await generate_chat_recommendation_text(context)
        notes_by_ramp = {spot.ramp_id: spot for spot in summary.spot_notes}
        for rec in recommendations:
            generated = notes_by_ramp.get(rec.ramp_id)
            if generated:
                rec.boating_notes = (generated.boating_notes or rec.boating_notes)[:4]
                rec.fishing_notes = (generated.fishing_notes or rec.fishing_notes)[:4]

        merged_warnings = list(dict.fromkeys([*warnings, *summary.warnings]))
        return ChatRecommendationResponse(
            assistant_message=summary.assistant_message,
            intent=intent,
            recommendations=recommendations,
            warnings=merged_warnings,
            disclaimer=DISCLAIMER,
            sources=sorted(global_sources.values(), key=lambda c: (c.provider, c.name)),
            suggested_followups=summary.suggested_followups,
            used_openai=summary.used_openai,
        )

    def _build_source_cards(self, best: LaunchScore | None) -> list[ChatSourceCard]:
        if not best:
            return [
                ChatSourceCard(
                    name="Launch scoring inputs",
                    provider="rampready",
                    status="missing",
                    notes=["No launch score was available."],
                )
            ]
        summary = best.source_summary or {}
        cards = [
            _source_card_from_summary(
                "NWS hourly forecast",
                "National Weather Service",
                summary.get("weather", {}),
            ),
            _source_card_from_summary(
                "NWS active alerts",
                "National Weather Service",
                summary.get("alerts", {}),
            ),
            _source_card_from_summary(
                "NOAA CO-OPS tide predictions",
                "NOAA CO-OPS Tides & Currents",
                summary.get("tide", {}),
            ),
            _source_card_from_summary(
                "NOAA NDBC buoy observations",
                "NOAA National Data Buoy Center",
                summary.get("buoy", {}),
            ),
        ]
        return cards

    async def _water_quality_card(self, ramp: Ramp) -> ChatSourceCard:
        client = FdohClient()
        try:
            payload = await client.get_nearby_sampling(float(ramp.latitude), float(ramp.longitude))
            cards = client.normalize_sampling_cards(payload)
            if cards:
                return ChatSourceCard(
                    name=cards[0].name,
                    provider=cards[0].provider,
                    url=cards[0].url,
                    updated_at=cards[0].updated_at,
                    freshness_minutes=cards[0].freshness_minutes,
                    status=cards[0].status,
                    notes=cards[0].notes,
                )
        except Exception:
            return ChatSourceCard(
                name="Florida Healthy Beaches water quality",
                provider="Florida Department of Health",
                url="https://www.floridahealth.gov/environmental-health/beach-water-quality/",
                status="error",
                notes=["Water-quality sampling data could not be retrieved for this ramp."],
            )
        return ChatSourceCard(
            name="Florida Healthy Beaches water quality",
            provider="Florida Department of Health",
            url="https://www.floridahealth.gov/environmental-health/beach-water-quality/",
            status="missing",
            notes=["No nearby sampling record was found in the supplemental water-quality source."],
        )
