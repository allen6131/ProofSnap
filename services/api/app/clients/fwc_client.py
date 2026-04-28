from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.clients.base import BaseHttpClient


class FwcRampImporter(BaseHttpClient):
    url = 'https://gis.myfwc.com/mapping/rest/services/Open_Data/FWC_Florida_Boat_Ramp_Inventory/MapServer/4/query'

    async def fetch_geojson(self) -> dict[str, Any]:
        return await self.get_json(
            self.url,
            params={
                'where': '1=1',
                'outFields': '*',
                'f': 'geojson',
            },
        )

    @staticmethod
    def normalize_feature(feature: dict[str, Any]) -> dict[str, Any]:
        props = feature.get('properties', {})
        coords = feature.get('geometry', {}).get('coordinates', [None, None])
        return {
            'name': props.get('FACILITY') or props.get('NAME') or 'Unnamed Ramp',
            'latitude': coords[1],
            'longitude': coords[0],
            'source': 'fwc',
            'source_id': str(props.get('OBJECTID') or props.get('FID') or ''),
            'source_url': 'https://www.arcgis.com/home/item.html?id=1f95492ed263499f8faff1874f3de4ca',
            'address': props.get('ADDRESS'),
            'county': props.get('COUNTY'),
            'city': props.get('CITY'),
            'state': 'FL',
            'lanes': props.get('LANES') if isinstance(props.get('LANES'), int) else None,
            'parking': str(props.get('PARKING')) if props.get('PARKING') else None,
            'fee': str(props.get('FEE')) if props.get('FEE') else None,
            'restrooms': bool(props.get('RESTROOM')) if props.get('RESTROOM') is not None else None,
            'managing_agency': props.get('AGENCY') or props.get('MANAGING_AGENCY'),
            'trailer_friendly': True,
            'kayak_friendly': True,
            'jet_ski_friendly': True,
            'confidence_score': 70,
            'raw_source': props,
        }


def load_fwc_fixture(name: str = 'fwc_ramps.geojson') -> dict[str, Any]:
    fixture_path = Path(__file__).resolve().parents[2] / 'tests' / 'fixtures' / name
    return json.loads(fixture_path.read_text())
