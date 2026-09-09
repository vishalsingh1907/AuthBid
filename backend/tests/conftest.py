import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from models.database import store_tender, _tenders_store, _verification_results, _audit_trail
from mock_apis.synthetic_data import SAMPLE_TENDER


@pytest.fixture(autouse=True)
def reset_in_memory_db():
    """Reset in-memory storage before each test and reseed sample tender."""
    _tenders_store.clear()
    _verification_results.clear()
    _audit_trail.clear()
    store_tender(dict(SAMPLE_TENDER))
    yield


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client
