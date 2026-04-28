from __future__ import annotations

from datetime import datetime, timezone

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clients.fwc_client import FwcRampImporter, load_fwc_fixture
from app.models.entities import Ramp, Region

TAMPA_BBOX = {
    'min_lat': 27.3,
    'max_lat': 28.3,
    'min_lon': -83.2,
    'max_lon': -82.0,
}


def in_tampa_bbox(lat: float, lon: float) -> bool:
    return TAMPA_BBOX['min_lat'] <= lat <= TAMPA_BBOX['max_lat'] and TAMPA_BBOX['min_lon'] <= lon <= TAMPA_BBOX['max_lon']


def import_fwc_ramps(db: Session, use_fixture: bool = False) -> dict:
    importer = FwcRampImporter()
    payload: dict
    if use_fixture:
        payload = load_fwc_fixture()
    else:
        import asyncio

        try:
            payload = asyncio.run(importer.fetch_geojson())
        except Exception:
            payload = load_fwc_fixture()

    region = db.scalar(select(Region).where(Region.slug == 'tampa-bay'))

    created = 0
    updated = 0

    for feature in payload.get('features', []):
        norm = importer.normalize_feature(feature)
        if norm['latitude'] is None or norm['longitude'] is None:
            continue
        if not in_tampa_bbox(float(norm['latitude']), float(norm['longitude'])):
            continue

        existing = db.scalar(select(Ramp).where(Ramp.source == 'fwc', Ramp.source_id == norm['source_id']))
        if existing:
            for key, value in norm.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.slug = slugify(existing.name)
            existing.updated_at = datetime.now(timezone.utc)
            existing.region_id = region.id if region else None
            updated += 1
            continue

        ramp = Ramp(
            name=norm['name'],
            slug=slugify(norm['name']),
            latitude=norm['latitude'],
            longitude=norm['longitude'],
            source='fwc',
            source_id=norm['source_id'],
            source_url=norm['source_url'],
            address=norm['address'],
            county=norm['county'],
            city=norm['city'],
            state='FL',
            lanes=norm['lanes'],
            parking=norm['parking'],
            fee=norm['fee'],
            restrooms=norm['restrooms'],
            managing_agency=norm['managing_agency'],
            trailer_friendly=norm['trailer_friendly'],
            kayak_friendly=norm['kayak_friendly'],
            jet_ski_friendly=norm['jet_ski_friendly'],
            confidence_score=norm['confidence_score'],
            raw_source=norm['raw_source'],
            region_id=region.id if region else None,
            status='active',
        )
        db.add(ramp)
        created += 1

    db.commit()
    return {'created': created, 'updated': updated, 'total': created + updated}
