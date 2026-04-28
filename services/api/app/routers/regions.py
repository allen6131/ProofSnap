from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.entities import Region

router = APIRouter(prefix='/regions', tags=['regions'])


@router.get('')
def list_regions(db: Session = Depends(get_db)) -> list[dict]:
    regions = list(db.scalars(select(Region).where(Region.is_active.is_(True)).order_by(Region.name.asc())))
    return [
        {
            'id': r.id,
            'name': r.name,
            'slug': r.slug,
            'bbox': r.bbox_geojson,
            'default_timezone': r.default_timezone,
            'is_active': r.is_active,
        }
        for r in regions
    ]


@router.get('/{slug}')
def get_region(slug: str, db: Session = Depends(get_db)) -> dict:
    region = db.scalar(select(Region).where(Region.slug == slug))
    if not region:
        raise HTTPException(status_code=404, detail='Region not found')
    return {
        'id': region.id,
        'name': region.name,
        'slug': region.slug,
        'bbox': region.bbox_geojson,
        'default_timezone': region.default_timezone,
        'is_active': region.is_active,
    }
