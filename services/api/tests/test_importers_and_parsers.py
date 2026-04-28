import json
from pathlib import Path

from app.clients.coops_client import CoopsClient
from app.clients.fwc_client import FwcRampImporter
from app.clients.ndbc_client import NdbcClient

fixtures = Path(__file__).resolve().parent / 'fixtures'



def test_fwc_importer_normalizes_fixture() -> None:
    payload = json.loads((fixtures / 'fwc_ramps.geojson').read_text())
    feature = payload['features'][0]
    norm = FwcRampImporter.normalize_feature(feature)
    assert norm['name']
    assert norm['latitude'] is not None
    assert norm['longitude'] is not None
    assert norm['source'] == 'fwc'



def test_ndbc_parser_with_fixture() -> None:
    txt = (fixtures / 'ndbc_41002.txt').read_text()
    spec = (fixtures / 'ndbc_41002.spec').read_text()
    client = NdbcClient()
    row = client.parse_txt_latest(txt)
    wave = client.parse_spec_latest(spec)
    assert row['wind_speed_kt'] is not None
    assert row['wave_height_ft'] is not None or wave['wave_height_ft'] is not None



def test_coops_tide_parser_with_fixture() -> None:
    payload = json.loads((fixtures / 'coops_predictions.json').read_text())
    client = CoopsClient()
    row = client.normalize_prediction(payload['predictions'][0])
    assert row['tide_height_ft_mllw'] is not None
