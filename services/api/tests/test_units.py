from app.utils.units import (
    c_to_f,
    kmh_to_kt,
    meters_to_feet,
    mph_to_kt,
    ms_to_kt,
    parse_nws_wind_string,
)


def test_unit_conversions() -> None:
    assert mph_to_kt(10) == 8.69
    assert ms_to_kt(10) == 19.44
    assert kmh_to_kt(10) == 5.4
    assert meters_to_feet(2) == 6.56
    assert c_to_f(20) == 68.0


def test_parse_nws_wind_string_variants() -> None:
    assert parse_nws_wind_string("10 mph")[:2] == (8.69, 8.69)
    assert parse_nws_wind_string("10 to 15 mph")[:2] == (8.69, 13.03)
    assert parse_nws_wind_string("15 kt")[:2] == (15.0, 15.0)
    assert parse_nws_wind_string("20 to 25 kt")[:2] == (20.0, 25.0)
