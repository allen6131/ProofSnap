from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.clients.base import BaseHttpClient


class CoopsClient(BaseHttpClient):
    data_url = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"
    metadata_url = "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json"

    async def get_station_metadata(self) -> dict[str, Any]:
        return await self.get_json(self.metadata_url, params={"format": "json"})

    async def get_data(self, **params: Any) -> dict[str, Any]:
        base = {
            "application": "rampready",
            "format": "json",
            "units": "english",
            "time_zone": "gmt",
        }
        base.update(params)
        return await self.get_json(self.data_url, params=base)

    async def get_predictions(
        self,
        station_id: str,
        begin_date: str,
        end_date: str,
        datum: str = "MLLW",
        interval: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "product": "predictions",
            "station": station_id,
            "begin_date": begin_date,
            "end_date": end_date,
            "datum": datum,
        }
        if interval:
            params["interval"] = interval
        return await self.get_data(**params)

    async def get_latest_product(
        self, station_id: str, product: str, datum: str | None = None
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "product": product,
            "station": station_id,
            "date": "latest",
        }
        if datum:
            params["datum"] = datum
        return await self.get_data(**params)

    def normalize_prediction(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "predicted_at": row.get("t"),
            "tide_height_ft_mllw": float(row["v"]) if row.get("v") not in {None, ""} else None,
            "type": row.get("type") or "prediction",
            "raw_payload": row,
            "normalized_at": datetime.now(timezone.utc).isoformat(),
        }

    def normalize_water_level(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "observed_at": row.get("t"),
            "water_level_ft_mllw": float(row["v"]) if row.get("v") not in {None, ""} else None,
            "raw_payload": row,
            "normalized_at": datetime.now(timezone.utc).isoformat(),
        }

    def normalize_current_prediction(self, row: dict[str, Any]) -> dict[str, Any]:
        speed = row.get("s") or row.get("Velocity_Major") or row.get("v")
        direction = row.get("d") or row.get("Direction")
        return {
            "predicted_at": row.get("t"),
            "current_speed_kt": float(speed) if speed not in {None, ""} else None,
            "current_direction_deg": float(direction) if direction not in {None, ""} else None,
            "type": row.get("type") or "prediction",
            "raw_payload": row,
            "normalized_at": datetime.now(timezone.utc).isoformat(),
        }

    def normalize_temperature(self, row: dict[str, Any], key: str) -> dict[str, Any]:
        value = row.get("v")
        return {
            "observed_at": row.get("t"),
            key: float(value) if value not in {None, ""} else None,
            "raw_payload": row,
            "normalized_at": datetime.now(timezone.utc).isoformat(),
        }

    def normalize_wind(self, row: dict[str, Any]) -> dict[str, Any]:
        speed = row.get("s")
        gust = row.get("g")
        direction = row.get("d")
        return {
            "observed_at": row.get("t"),
            "wind_speed_kt": float(speed) if speed not in {None, ""} else None,
            "wind_gust_kt": float(gust) if gust not in {None, ""} else None,
            "wind_direction_deg": float(direction) if direction not in {None, ""} else None,
            "raw_payload": row,
            "normalized_at": datetime.now(timezone.utc).isoformat(),
        }


def load_coops_fixture(name: str) -> dict[str, Any]:
    fixture_path = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / name
    import json

    return json.loads(fixture_path.read_text())
