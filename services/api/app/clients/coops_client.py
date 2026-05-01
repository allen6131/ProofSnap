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
            "application": "RampReady",
            "format": "json",
            "units": "english",
            "time_zone": "gmt",
        }
        base.update(params)
        return await self.get_json(self.data_url, params=base)

    def normalize_prediction(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            "predicted_at": row.get("t"),
            "tide_height_ft_mllw": float(row["v"]) if row.get("v") not in {None, ""} else None,
            "type": row.get("type") or "prediction",
            "raw_payload": row,
            "normalized_at": datetime.now(timezone.utc).isoformat(),
        }


def load_coops_fixture(name: str) -> dict[str, Any]:
    fixture_path = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / name
    import json

    return json.loads(fixture_path.read_text())
