from app.clients.coops_client import CoopsClient
from app.clients.fdoh_client import FdohClient


def test_coops_normalizers_parse_supported_products():
    client = CoopsClient()

    water = client.normalize_water_level({"t": "2026-05-06 12:00", "v": "1.25"})
    assert water["water_level_ft_mllw"] == 1.25

    current = client.normalize_current_prediction({"t": "2026-05-06 12:00", "s": "0.8", "d": "185"})
    assert current["current_speed_kt"] == 0.8
    assert current["current_direction_deg"] == 185

    wind = client.normalize_wind({"t": "2026-05-06 12:00", "s": "7", "g": "11", "d": "90"})
    assert wind["wind_speed_kt"] == 7
    assert wind["wind_gust_kt"] == 11


def test_fdoh_normalizes_arcgis_features_to_source_cards():
    client = FdohClient()
    cards = client.normalize_sampling_cards(
        {
            "features": [
                {
                    "attributes": {
                        "BEACH_NAME": "Sample Beach",
                        "STATUS": "Good",
                        "ENTEROCOCCI": "12",
                        "SAMPLE_DATE": 1778068800000,
                    }
                }
            ]
        }
    )

    assert len(cards) == 1
    assert cards[0].provider == "Florida Department of Health"
    assert cards[0].status == "supplemental"
    assert cards[0].name == "Sample Beach"
