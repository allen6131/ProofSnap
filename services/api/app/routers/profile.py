from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.entities import LaunchScore, Ramp, UserProfile
from app.schemas.profile import UserProfileRequest, UserProfileResponse
from app.security.deps import get_current_user
from app.services.ramp_service import get_saved_ramps

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(
    user=Depends(get_current_user), db: Session = Depends(get_db)
) -> UserProfileResponse:
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    return UserProfileResponse.model_validate(profile.__dict__)


@router.put("/profile", response_model=UserProfileResponse)
def put_profile(
    payload: UserProfileRequest, user=Depends(get_current_user), db: Session = Depends(get_db)
) -> UserProfileResponse:
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return UserProfileResponse.model_validate(profile.__dict__)


@router.get("/saved-ramps")
def list_saved_ramps(user=Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    saved = get_saved_ramps(db, user)
    results = []
    for row in saved:
        ramp = db.get(Ramp, row.ramp_id)
        latest_score = db.scalar(
            select(LaunchScore)
            .where(
                LaunchScore.ramp_id == row.ramp_id, LaunchScore.user_profile_id == user.profile.id
            )
            .order_by(LaunchScore.starts_at.asc())
            .limit(1)
        )
        results.append(
            {
                "id": row.id,
                "ramp_id": row.ramp_id,
                "nickname": row.nickname,
                "created_at": row.created_at,
                "ramp": {"id": ramp.id, "name": ramp.name, "city": ramp.city, "state": ramp.state},
                "next_window": (
                    {
                        "color": latest_score.color,
                        "starts_at": latest_score.starts_at,
                        "reasons": latest_score.reasons[:2],
                    }
                    if latest_score
                    else None
                ),
            }
        )
    return results


@router.get("/dashboard")
def dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    saved = get_saved_ramps(db, user)
    rows = []
    for saved_ramp in saved:
        ramp = db.get(Ramp, saved_ramp.ramp_id)
        score = db.scalar(
            select(LaunchScore)
            .where(
                LaunchScore.ramp_id == saved_ramp.ramp_id,
                LaunchScore.user_profile_id == user.profile.id,
            )
            .order_by(LaunchScore.starts_at.asc())
            .limit(1)
        )
        rows.append(
            {
                "ramp_id": ramp.id,
                "ramp_name": ramp.name,
                "color": score.color if score else "gray",
                "next_best_window": score.starts_at if score else None,
                "top_reasons": score.reasons[:2] if score else [],
                "active_alerts": (
                    score.source_summary.get("alerts", {}).get("active_count", 0) if score else 0
                ),
            }
        )
    return {"items": rows, "empty_message": "Save your first ramp to get launch windows."}
