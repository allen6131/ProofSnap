from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.clients.base import BaseHttpClient
from app.config import get_settings
from app.utils.units import parse_nws_wind_string


class NWSClient(BaseHttpClient):
    base_url = 'https://api.weather.gov'

    def __init__(self) -> None:
        super().__init__()
        settings = get_settings()
        self.headers = {
            'User-Agent': settings.nws_user_agent,
            'Accept': 'application/geo+json',
        }

    async def get_points(self, latitude: float, longitude: float) -> dict[str, Any]:
        return await self.get_json(f'{self.base_url}/points/{latitude},{longitude}', headers=self.headers)

    async def get_grid(self, office: str, grid_x: int, grid_y: int) -> dict[str, Any]:
        return await self.get_json(f'{self.base_url}/gridpoints/{office}/{grid_x},{grid_y}', headers=self.headers)

    async def get_hourly(self, office: str, grid_x: int, grid_y: int) -> dict[str, Any]:
        return await self.get_json(f'{self.base_url}/gridpoints/{office}/{grid_x},{grid_y}/forecast/hourly', headers=self.headers)

    async def get_alerts(self, latitude: float, longitude: float) -> dict[str, Any]:
        return await self.get_json(f'{self.base_url}/alerts/active', headers=self.headers, params={'point': f'{latitude},{longitude}'})

    def normalize_hourly_period(self, period: dict[str, Any]) -> dict[str, Any]:
        wind_low, wind_high, _ = parse_nws_wind_string(period.get('windSpeed'))
        gust_low, gust_high, _ = parse_nws_wind_string(period.get('windGust'))
        return {
            'valid_time': period.get('startTime'),
            'valid_until': period.get('endTime'),
            'wind_speed_kt': wind_high or wind_low,
            'wind_gust_kt': gust_high or gust_low,
            'wind_direction_deg': self._direction_to_degrees(period.get('windDirection')),
            'precipitation_probability_pct': (period.get('probabilityOfPrecipitation') or {}).get('value'),
            'weather_summary': period.get('shortForecast'),
            'raw_payload': period,
            'normalized_at': datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _direction_to_degrees(direction: str | None) -> int | None:
        if not direction:
            return None
        mapping = {
            'N': 0,
            'NNE': 22,
            'NE': 45,
            'ENE': 67,
            'E': 90,
            'ESE': 112,
            'SE': 135,
            'SSE': 157,
            'S': 180,
            'SSW': 202,
            'SW': 225,
            'WSW': 247,
            'W': 270,
            'WNW': 292,
            'NW': 315,
            'NNW': 337,
        }
        return mapping.get(direction.strip().upper())


def load_nws_fixture(name: str) -> dict[str, Any]:
    fixture_path = Path(__file__).resolve().parents[2] / 'tests' / 'fixtures' / name
    import json

    return json.loads(fixture_path.read_text())
