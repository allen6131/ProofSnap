from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from app.clients.base import BaseHttpClient
from app.utils.units import c_to_f, meters_to_feet, ms_to_kt


class NdbcClient(BaseHttpClient):
    base_url = "https://www.ndbc.noaa.gov/data/realtime2"

    async def get_station_txt(self, station_id: str) -> str:
        return await self.get_text(f"{self.base_url}/{station_id}.txt")

    async def get_station_spec(self, station_id: str) -> str:
        return await self.get_text(f"{self.base_url}/{station_id}.spec")

    def parse_txt_latest(self, payload: str) -> dict:
        lines = [line.strip() for line in payload.splitlines() if line.strip()]
        if len(lines) < 3:
            return {}
        headers = lines[0].split()
        values = lines[2].split()
        row = dict(zip(headers, values, strict=False))

        def to_float(key: str) -> float | None:
            value = row.get(key)
            if value in {None, "MM"}:
                return None
            return float(value)

        observed_at = datetime(
            int(row["#YY"]) + 2000 if len(row["#YY"]) == 2 else int(row["#YY"]),
            int(row["MM"]),
            int(row["DD"]),
            int(row["hh"]),
            int(row["mm"]),
            tzinfo=timezone.utc,
        )

        wind_ms = to_float("WSPD")
        gust_ms = to_float("GST")
        wave_m = to_float("WVHT")
        atmp_c = to_float("ATMP")
        wtmp_c = to_float("WTMP")

        return {
            "observed_at": observed_at,
            "wind_direction_deg": to_float("WDIR"),
            "wind_speed_kt": ms_to_kt(wind_ms) if wind_ms is not None else None,
            "wind_gust_kt": ms_to_kt(gust_ms) if gust_ms is not None else None,
            "wave_height_ft": meters_to_feet(wave_m) if wave_m is not None else None,
            "dominant_period_sec": to_float("DPD"),
            "average_period_sec": to_float("APD"),
            "mean_wave_direction_deg": to_float("MWD"),
            "air_temperature_f": c_to_f(atmp_c) if atmp_c is not None else None,
            "water_temperature_f": c_to_f(wtmp_c) if wtmp_c is not None else None,
            "pressure_mb": to_float("PRES"),
            "raw_payload": row,
        }

    def parse_spec_latest(self, payload: str) -> dict:
        lines = [line.strip() for line in payload.splitlines() if line.strip()]
        if len(lines) < 3:
            return {}
        headers = lines[0].split()
        values = lines[2].split()
        row = dict(zip(headers, values, strict=False))

        def to_float(key: str) -> float | None:
            value = row.get(key)
            if value in {None, "MM"}:
                return None
            return float(value)

        wvht = to_float("WVHT")
        return {
            "wave_height_ft": meters_to_feet(wvht) if wvht is not None else None,
            "dominant_period_sec": to_float("DPD"),
            "average_period_sec": to_float("APD"),
            "mean_wave_direction_deg": to_float("MWD"),
            "raw_payload": row,
        }


def load_ndbc_fixture(name: str) -> str:
    fixture_path = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / name
    return fixture_path.read_text()
