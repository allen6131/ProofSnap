from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.models.entities import Region, User, UserProfile
from app.security.password import hash_password


def run_seed() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == settings.admin_email.lower()))
        if not admin:
            admin = User(
                email=settings.admin_email.lower(),
                password_hash=hash_password(settings.admin_password),
                role="admin",
                subscription_tier="pro",
            )
            db.add(admin)
            db.flush()
            db.add(
                UserProfile(
                    user_id=admin.id, display_name="rampready Admin", boat_type="center_console"
                )
            )

        region = db.scalar(select(Region).where(Region.slug == "tampa-bay"))
        if not region:
            region = Region(
                name="Tampa Bay",
                slug="tampa-bay",
                bbox_geojson={
                    "type": "Polygon",
                    "coordinates": [
                        [[-83.2, 27.3], [-82.0, 27.3], [-82.0, 28.3], [-83.2, 28.3], [-83.2, 27.3]]
                    ],
                },
                default_timezone="America/New_York",
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(region)

        db.commit()
        print("Seed completed: admin + tampa-bay region")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
