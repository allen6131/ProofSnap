from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.entities import JobRun, Ramp, RampReport, RampStationLink, SavedRamp, Station
from app.schemas.admin import RampUpdateRequest, StationLinkCreateRequest, StationLinkUpdateRequest
from app.security.deps import require_admin
from app.services.importers import import_fwc_ramps
from app.services.ramp_service import get_ramp_or_404
from app.services.source_sync import refresh_ramp_sources

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/ramps")
def admin_list_ramps(db: Session = Depends(get_db)) -> list[dict]:
    ramps = list(db.scalars(select(Ramp).order_by(Ramp.updated_at.desc())))
    return [
        {
            "id": r.id,
            "name": r.name,
            "source": r.source,
            "status": r.status,
            "confidence_score": r.confidence_score,
            "manually_verified_at": r.manually_verified_at,
            "region_id": r.region_id,
        }
        for r in ramps
    ]


@router.get("/ramps/{ramp_id}")
def admin_get_ramp(ramp_id: str, db: Session = Depends(get_db)) -> dict:
    ramp = get_ramp_or_404(db, ramp_id)
    return {k: v for k, v in ramp.__dict__.items() if not k.startswith("_")}


@router.put("/ramps/{ramp_id}")
def admin_update_ramp(
    ramp_id: str, payload: RampUpdateRequest, db: Session = Depends(get_db)
) -> dict:
    ramp = get_ramp_or_404(db, ramp_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ramp, key, value)
    ramp.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ramp)
    return {"id": ramp.id, "updated_at": ramp.updated_at}


@router.post("/ramps")
def admin_create_ramp(payload: dict, db: Session = Depends(get_db)) -> dict:
    required = ["name", "latitude", "longitude"]
    for field in required:
        if field not in payload:
            raise HTTPException(status_code=400, detail=f"{field} is required")
    ramp = Ramp(
        name=payload["name"],
        latitude=payload["latitude"],
        longitude=payload["longitude"],
        source=payload.get("source", "manual"),
        status=payload.get("status", "unknown"),
        confidence_score=payload.get("confidence_score", 50),
        city=payload.get("city"),
        county=payload.get("county"),
        state=payload.get("state", "FL"),
        address=payload.get("address"),
    )
    db.add(ramp)
    db.commit()
    db.refresh(ramp)
    return {"id": ramp.id}


@router.post("/ramps/{ramp_id}/verify")
def admin_verify_ramp(ramp_id: str, db: Session = Depends(get_db)) -> dict:
    ramp = get_ramp_or_404(db, ramp_id)
    ramp.manually_verified_at = datetime.now(timezone.utc)
    ramp.status = "active"
    db.commit()
    return {"id": ramp.id, "manually_verified_at": ramp.manually_verified_at}


@router.get("/stations")
def admin_list_stations(db: Session = Depends(get_db)) -> list[dict]:
    stations = list(db.scalars(select(Station).order_by(Station.updated_at.desc())))
    return [{k: v for k, v in s.__dict__.items() if not k.startswith("_")} for s in stations]


@router.put("/stations/{station_id}")
def admin_update_station(station_id: str, payload: dict, db: Session = Depends(get_db)) -> dict:
    station = db.get(Station, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    for key, value in payload.items():
        if hasattr(station, key):
            setattr(station, key, value)
    station.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": station.id}


@router.get("/ramps/{ramp_id}/station-links")
def admin_get_station_links(ramp_id: str, db: Session = Depends(get_db)) -> list[dict]:
    links = list(db.scalars(select(RampStationLink).where(RampStationLink.ramp_id == ramp_id)))
    return [{k: v for k, v in link.__dict__.items() if not k.startswith("_")} for link in links]


@router.post("/ramps/{ramp_id}/station-links")
def admin_create_station_link(
    ramp_id: str, payload: StationLinkCreateRequest, db: Session = Depends(get_db)
) -> dict:
    get_ramp_or_404(db, ramp_id)
    if not db.get(Station, payload.station_id):
        raise HTTPException(status_code=404, detail="Station not found")

    link = RampStationLink(ramp_id=ramp_id, **payload.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return {"id": link.id}


@router.put("/ramp-station-links/{link_id}")
def admin_update_station_link(
    link_id: str, payload: StationLinkUpdateRequest, db: Session = Depends(get_db)
) -> dict:
    link = db.get(RampStationLink, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(link, key, value)
    link.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": link.id}


@router.delete("/ramp-station-links/{link_id}")
def admin_delete_station_link(link_id: str, db: Session = Depends(get_db)) -> dict:
    link = db.get(RampStationLink, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
    return {"ok": True}


@router.post("/import/fwc")
def admin_import_fwc(db: Session = Depends(get_db)) -> dict:
    details = import_fwc_ramps(db, use_fixture=False)
    run = JobRun(job_name="import_fwc_ramps", status="success", details=details)
    db.add(run)
    db.commit()
    return details


@router.post("/import/osm")
def admin_import_osm(payload: dict, db: Session = Depends(get_db)) -> dict:
    run = JobRun(
        job_name="import_osm_ramps",
        status="success",
        details={"note": "Dev-only placeholder", "bbox": payload.get("bbox")},
    )
    db.add(run)
    db.commit()
    return {
        "ok": True,
        "note": "OSM import is dev-only for MVP. Public Overpass should not be production backend.",
    }


@router.post("/recompute-links")
def admin_recompute_links(db: Session = Depends(get_db)) -> dict:
    run = JobRun(
        job_name="link_ramps_to_stations",
        status="success",
        details={"note": "Spatial linking placeholder for MVP vertical slice"},
    )
    db.add(run)
    db.commit()
    return {"ok": True}


@router.post("/refresh-ramp/{ramp_id}")
def admin_refresh_ramp(ramp_id: str, db: Session = Depends(get_db)) -> dict:
    ramp = get_ramp_or_404(db, ramp_id)
    details = refresh_ramp_sources(db, ramp, use_fixture=False)
    run = JobRun(job_name="refresh_ramp", status="success", details={"ramp_id": ramp_id, **details})
    db.add(run)
    db.commit()
    return details


@router.post("/recompute-scores")
def admin_recompute_scores(db: Session = Depends(get_db)) -> dict:
    run = JobRun(
        job_name="recompute_launch_scores",
        status="success",
        details={"note": "Scores recomputed lazily on request"},
    )
    db.add(run)
    db.commit()
    return {"ok": True}


@router.get("/job-runs")
def admin_job_runs(db: Session = Depends(get_db)) -> list[dict]:
    runs = list(db.scalars(select(JobRun).order_by(JobRun.started_at.desc()).limit(200)))
    return [{k: v for k, v in run.__dict__.items() if not k.startswith("_")} for run in runs]


@router.get("/reports")
def admin_reports(db: Session = Depends(get_db)) -> list[dict]:
    reports = list(db.scalars(select(RampReport).order_by(RampReport.created_at.desc()).limit(200)))
    return [{k: v for k, v in row.__dict__.items() if not k.startswith("_")} for row in reports]


@router.put("/reports/{report_id}")
def admin_update_report(report_id: str, payload: dict, db: Session = Depends(get_db)) -> dict:
    report = db.get(RampReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = payload.get("status", report.status)
    report.reviewed_at = datetime.now(timezone.utc)

    if payload.get("apply_to_ramp"):
        ramp = db.get(Ramp, report.ramp_id)
        if ramp and report.report_type == "ramp_closed":
            ramp.status = "closed"

    db.commit()
    return {"id": report.id, "status": report.status}


@router.get("/overview")
def admin_overview(db: Session = Depends(get_db)) -> dict:
    return {
        "ramps": db.query(Ramp).count(),
        "active_ramps": db.query(Ramp).filter(Ramp.status == "active").count(),
        "saved_ramps": db.query(SavedRamp).count(),
        "stations": db.query(Station).count(),
        "failed_jobs": db.query(JobRun).filter(JobRun.status == "error").count(),
        "recent_reports": db.query(RampReport).count(),
        "data_source_health": {
            "nws": "ok",
            "coops": "ok",
            "ndbc": "ok",
            "open_meteo": "disabled",
        },
    }
