from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import Ramp, RampStationLink, Station

EARTH_RADIUS_NM = 3440.065

FALLBACK_STATIONS = [
    {
        "provider": "coops",
        "provider_station_id": "8726520",
        "station_type": "tide",
        "name": "St. Petersburg",
        "latitude": 27.760,
        "longitude": -82.626,
        "products": {"predictions": True, "water_level": True},
        "source_url": "https://api.tidesandcurrents.noaa.gov/",
    },
    {
        "provider": "ndbc",
        "provider_station_id": "41002",
        "station_type": "buoy",
        "name": "NDBC 41002",
        "latitude": 26.0,
        "longitude": -78.0,
        "products": {"stdmet": True, "spec": True},
        "source_url": "https://www.ndbc.noaa.gov/",
    },
]


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return EARTH_RADIUS_NM * c


def ensure_default_tampa_bay_stations(db: Session) -> None:
    for payload in FALLBACK_STATIONS:
        existing = db.scalar(
            select(Station).where(
                Station.provider == payload["provider"],
                Station.provider_station_id == payload["provider_station_id"],
                Station.station_type == payload["station_type"],
            )
        )
        if existing:
            continue
        db.add(Station(**payload))
    db.flush()


def nearest_station(
    db: Session,
    ramp: Ramp,
    *,
    provider: str,
    station_type: str,
    max_distance_nm: float | None = None,
) -> Station | None:
    ensure_default_tampa_bay_stations(db)
    stations = list(
        db.scalars(
            select(Station).where(
                Station.provider == provider,
                Station.station_type == station_type,
                Station.active.is_(True),
                Station.latitude.is_not(None),
                Station.longitude.is_not(None),
            )
        )
    )
    if not stations:
        return None

    ramp_lat = float(ramp.latitude)
    ramp_lon = float(ramp.longitude)
    station_distances = [
        (
            station,
            haversine_nm(
                ramp_lat,
                ramp_lon,
                float(station.latitude),
                float(station.longitude),
            ),
        )
        for station in stations
    ]
    station, distance = min(station_distances, key=lambda row: row[1])
    if max_distance_nm is not None and distance > max_distance_nm:
        return None
    link_type = station_type
    existing = db.scalar(
        select(RampStationLink).where(
            RampStationLink.ramp_id == ramp.id,
            RampStationLink.station_id == station.id,
            RampStationLink.link_type == link_type,
        )
    )
    if existing:
        existing.distance_nm = distance
        existing.is_primary = True
        existing.confidence_score = 80 if distance is not None and distance <= 25 else 55
        db.flush()
        return station

    db.add(
        RampStationLink(
            ramp_id=ramp.id,
            station_id=station.id,
            link_type=link_type,
            distance_nm=distance,
            is_primary=True,
            confidence_score=80 if distance is not None and distance <= 25 else 55,
            notes="Auto-linked by nearest-station fallback for MVP source refresh.",
        )
    )
    db.flush()
    return station
