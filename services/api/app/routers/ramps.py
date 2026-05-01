from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.ramp import RampIssueRequest
from app.security.deps import get_current_user, get_optional_user
from app.services.ramp_service import (
    create_ramp_report,
    get_launch_windows,
    get_ramp_conditions,
    get_ramp_or_404,
    list_ramps,
    remove_saved_ramp,
    save_ramp_for_user,
)

router = APIRouter(tags=["ramps"])


@router.get("/ramps")
def get_ramps(
    region: str | None = None,
    q: str | None = None,
    bbox: str | None = None,
    near_lat: float | None = None,
    near_lon: float | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    _ = bbox
    ramps = list_ramps(db, region=region, q=q, near_lat=near_lat, near_lon=near_lon, limit=limit)
    return [
        {
            "id": r.id,
            "name": r.name,
            "latitude": float(r.latitude),
            "longitude": float(r.longitude),
            "city": r.city,
            "state": r.state,
            "trailer_friendly": r.trailer_friendly,
            "kayak_friendly": r.kayak_friendly,
            "jet_ski_friendly": r.jet_ski_friendly,
            "confidence_score": r.confidence_score,
            "source": r.source,
            "updated_at": r.updated_at,
        }
        for r in ramps
    ]


@router.get("/ramps/{ramp_id}")
def get_ramp(ramp_id: str, db: Session = Depends(get_db)) -> dict:
    ramp = get_ramp_or_404(db, ramp_id)
    return {
        "id": ramp.id,
        "name": ramp.name,
        "latitude": float(ramp.latitude),
        "longitude": float(ramp.longitude),
        "address": ramp.address,
        "city": ramp.city,
        "county": ramp.county,
        "state": ramp.state,
        "source": ramp.source,
        "status": ramp.status,
        "confidence_score": ramp.confidence_score,
        "manually_verified_at": ramp.manually_verified_at,
        "min_recommended_tide_ft_mllw": (
            float(ramp.min_recommended_tide_ft_mllw) if ramp.min_recommended_tide_ft_mllw else None
        ),
        "local_hazards": ramp.local_hazards,
        "notes": ramp.notes,
        "disclaimer": "RampReady is a planning and awareness tool only. It is not a navigation tool, not an emergency service, and not a substitute for official marine forecasts, nautical charts, local knowledge, or safe boating judgment. Weather, tide, water-level, current, buoy, and ramp information may be delayed, incomplete, preliminary, or inaccurate. Always check official NOAA/NWS sources and local conditions before launching.",
    }


@router.get("/ramps/{ramp_id}/conditions")
def ramp_conditions(ramp_id: str, db: Session = Depends(get_db)) -> dict:
    cond = get_ramp_conditions(db, ramp_id)

    def obj(o):
        if not o:
            return None
        data = {k: v for k, v in o.__dict__.items() if not k.startswith("_")}
        return data

    return {
        "ramp_id": ramp_id,
        "latest_observation": obj(cond["latest_observation"]),
        "latest_forecast": obj(cond["latest_forecast"]),
        "latest_tide_prediction": obj(cond["latest_tide_prediction"]),
        "active_alerts": [obj(a) for a in cond["active_alerts"]],
        "source_freshness": cond["source_freshness"],
        "source_names": [
            "National Weather Service",
            "NOAA CO-OPS Tides & Currents",
            "NOAA National Data Buoy Center",
        ],
    }


@router.get("/ramps/{ramp_id}/launch-windows")
def ramp_launch_windows(
    ramp_id: str,
    days: int = Query(7, ge=1, le=7),
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> dict:
    profile_id = user.profile.id if user and user.profile else None
    windows = get_launch_windows(db, ramp_id=ramp_id, profile_id=profile_id, days=days)
    return {
        "ramp_id": ramp_id,
        "windows": [
            {
                "starts_at": w.starts_at,
                "ends_at": w.ends_at,
                "color": w.color,
                "score": float(w.score),
                "confidence_score": w.confidence_score,
                "reasons": w.reasons,
                "source_summary": w.source_summary,
                "thresholds": w.thresholds,
            }
            for w in windows
        ],
    }


@router.post("/ramps/{ramp_id}/reports")
def report_ramp_issue(
    ramp_id: str,
    payload: RampIssueRequest,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> dict:
    report = create_ramp_report(
        db,
        user.id if user else None,
        ramp_id,
        payload.report_type,
        payload.message,
        payload.photo_url,
    )
    return {"id": report.id, "status": report.status}


@router.post("/me/saved-ramps/{ramp_id}")
def add_saved_ramp(
    ramp_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    saved = save_ramp_for_user(db, user, ramp_id)
    return {"id": saved.id, "ramp_id": saved.ramp_id, "created_at": saved.created_at}


@router.delete("/me/saved-ramps/{ramp_id}")
def delete_saved_ramp(
    ramp_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    remove_saved_ramp(db, user, ramp_id)
    return {"ok": True}
