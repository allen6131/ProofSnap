from __future__ import annotations

from datetime import datetime, timezone

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import select

from app.db import SessionLocal
from app.models.entities import JobRun, Ramp
from app.services.source_sync import refresh_ramp_sources


def run_job(job_name: str, fn):
    db = SessionLocal()
    run = JobRun(job_name=job_name, status="running", started_at=datetime.now(timezone.utc))
    db.add(run)
    db.commit()
    try:
        details = fn(db)
        run.status = "success"
        run.details = details if isinstance(details, dict) else {"result": str(details)}
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        run.status = "error"
        run.error = str(exc)
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()


def refresh_active_ramps(db):
    ramps = list(db.scalars(select(Ramp).limit(10)))
    out = {"ramps": 0}
    for ramp in ramps:
        refresh_ramp_sources(db, ramp, use_fixture=False)
        out["ramps"] += 1
    return out


def run_scheduler() -> None:
    scheduler = BlockingScheduler(timezone="UTC")

    scheduler.add_job(
        lambda: run_job(
            "sync_coops_station_metadata", lambda db: {"note": "metadata sync placeholder"}
        ),
        "cron",
        hour="2",
    )
    scheduler.add_job(
        lambda: run_job("link_ramps_to_stations", lambda db: {"note": "linker placeholder"}),
        "cron",
        hour="3",
    )
    scheduler.add_job(
        lambda: run_job("refresh_nws_forecasts", refresh_active_ramps), "interval", minutes=45
    )
    scheduler.add_job(
        lambda: run_job(
            "refresh_coops_tides", lambda db: {"note": "coops tide refresh placeholder"}
        ),
        "interval",
        hours=6,
    )
    scheduler.add_job(
        lambda: run_job(
            "refresh_coops_observations", lambda db: {"note": "coops obs refresh placeholder"}
        ),
        "interval",
        minutes=10,
    )
    scheduler.add_job(
        lambda: run_job(
            "refresh_ndbc_observations", lambda db: {"note": "ndbc refresh placeholder"}
        ),
        "cron",
        minute="30",
    )
    scheduler.add_job(
        lambda: run_job(
            "refresh_open_meteo_wave_forecasts",
            lambda db: {"note": "open meteo disabled by default"},
        ),
        "interval",
        hours=6,
    )
    scheduler.add_job(
        lambda: run_job(
            "recompute_launch_scores", lambda db: {"note": "scores computed on read in MVP slice"}
        ),
        "interval",
        minutes=30,
    )
    scheduler.add_job(
        lambda: run_job("cleanup_old_data", lambda db: {"note": "retention cleanup placeholder"}),
        "cron",
        hour="4",
    )

    scheduler.start()


if __name__ == "__main__":
    run_scheduler()
