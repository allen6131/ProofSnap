from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.clients.base import BaseHttpClient
from app.schemas.chat import ChatSourceCard


class FdohClient(BaseHttpClient):
    """Lightweight Florida Department of Health beach-water-quality source client.

    The official ArcGIS layers are supplemental for rampready. Failures should be
    surfaced as missing supplemental data rather than blocking launch guidance.
    """

    sampling_locations_url = (
        "https://ca.dep.state.fl.us/arcgis/rest/services/Map_Direct/Program_Support/"
        "MapServer/24/query"
    )

    async def query_sampling_locations(
        self, latitude: float, longitude: float, radius_miles: float = 15
    ) -> dict[str, Any]:
        degree_window = max(radius_miles / 69.0, 0.05)
        geometry = {
            "xmin": longitude - degree_window,
            "ymin": latitude - degree_window,
            "xmax": longitude + degree_window,
            "ymax": latitude + degree_window,
            "spatialReference": {"wkid": 4326},
        }
        return await self.get_json(
            self.sampling_locations_url,
            params={
                "f": "json",
                "where": "1=1",
                "outFields": "*",
                "returnGeometry": "true",
                "geometryType": "esriGeometryEnvelope",
                "inSR": "4326",
                "spatialRel": "esriSpatialRelIntersects",
                "geometry": str(geometry).replace("'", '"'),
            },
        )

    async def get_nearby_sampling(
        self, latitude: float, longitude: float, radius_miles: float = 15
    ) -> dict[str, Any]:
        return await self.query_sampling_locations(latitude, longitude, radius_miles)

    def normalize_sampling_locations(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        locations: list[dict[str, Any]] = []
        for feature in payload.get("features", []) or []:
            attrs = feature.get("attributes", {}) or {}
            geom = feature.get("geometry", {}) or {}
            name = (
                attrs.get("SAMPLING_LOCATION")
                or attrs.get("LOCATION")
                or attrs.get("BEACH_NAME")
                or attrs.get("NAME")
                or "FDOH beach sampling location"
            )
            locations.append(
                {
                    "name": str(name),
                    "county": attrs.get("COUNTY") or attrs.get("COUNTY_NAME"),
                    "epa_beach_id": attrs.get("EPA_BEACH_ID") or attrs.get("BEACH_ID"),
                    "latitude": geom.get("y") or attrs.get("LATITUDE"),
                    "longitude": geom.get("x") or attrs.get("LONGITUDE"),
                    "raw_payload": attrs,
                    "normalized_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        return locations

    def normalize_sampling_cards(self, payload: dict[str, Any]) -> list[ChatSourceCard]:
        cards: list[ChatSourceCard] = []
        for feature in payload.get("features", []) or []:
            attrs = feature.get("attributes", {}) or {}
            name = (
                attrs.get("SAMPLING_LOCATION")
                or attrs.get("LOCATION")
                or attrs.get("BEACH_NAME")
                or attrs.get("NAME")
                or "FDOH beach sampling location"
            )
            sample_date = attrs.get("SAMPLE_DATE") or attrs.get("DATE")
            updated_at = None
            if isinstance(sample_date, (int, float)):
                updated_at = datetime.fromtimestamp(sample_date / 1000, timezone.utc)
            elif isinstance(sample_date, str):
                try:
                    updated_at = datetime.fromisoformat(sample_date.replace("Z", "+00:00"))
                except ValueError:
                    updated_at = None
            status_value = str(attrs.get("STATUS") or attrs.get("ADVISORY") or "").strip()
            bacteria = attrs.get("ENTEROCOCCI") or attrs.get("RESULT") or attrs.get("VALUE")
            notes = ["Supplemental nearby beach-water-quality sampling source."]
            if status_value:
                notes.append(f"Reported status: {status_value}.")
            if bacteria not in {None, ""}:
                notes.append(f"Reported enterococci/result value: {bacteria}.")
            cards.append(
                ChatSourceCard(
                    name=str(name),
                    provider="Florida Department of Health",
                    url="https://www.floridahealth.gov/environmental-health/beach-water-quality/",
                    updated_at=updated_at,
                    status="supplemental",
                    notes=notes,
                )
            )
        return cards
