from __future__ import annotations

import math
import re

MPH_TO_KT = 0.868976
MS_TO_KT = 1.943844
KMH_TO_KT = 0.539957
M_TO_FT = 3.28084


def mph_to_kt(value: float) -> float:
    return round(value * MPH_TO_KT, 2)


def ms_to_kt(value: float) -> float:
    return round(value * MS_TO_KT, 2)


def kmh_to_kt(value: float) -> float:
    return round(value * KMH_TO_KT, 2)


def meters_to_feet(value: float) -> float:
    return round(value * M_TO_FT, 2)


def c_to_f(value: float) -> float:
    return round((value * 9 / 5) + 32, 2)


def nautical_miles_between(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    km = r_km * c
    return round(km * 0.539957, 2)


def parse_nws_wind_string(raw: str | None) -> tuple[float | None, float | None, str | None]:
    if not raw:
        return None, None, None

    text = raw.lower().strip()
    unit = 'mph'
    if ' kt' in text or text.endswith('kt'):
        unit = 'kt'
    elif ' km/h' in text or 'kph' in text:
        unit = 'kmh'
    elif ' m/s' in text:
        unit = 'ms'

    nums = [float(v) for v in re.findall(r"\d+(?:\.\d+)?", text)]
    if not nums:
        return None, None, unit

    low = nums[0]
    high = nums[1] if len(nums) > 1 else nums[0]

    if unit == 'kt':
        return round(low, 2), round(high, 2), unit
    if unit == 'kmh':
        return kmh_to_kt(low), kmh_to_kt(high), unit
    if unit == 'ms':
        return ms_to_kt(low), ms_to_kt(high), unit
    return mph_to_kt(low), mph_to_kt(high), unit
