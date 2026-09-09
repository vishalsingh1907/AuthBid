from datetime import datetime, timedelta
from routers.verification import _detect_anomalies


def test_director_overlap_detection():
    """Verify shared director DIN across bidders generates a critical director_overlap anomaly."""
    b1 = {
        "bidder_id": "B001",
        "entity_name": "Alpha Corp",
        "incorporation_date": "2020-01-01",
        "directors": [{"name": "Rajesh Sharma", "din": "01234567"}],
        "registered_address": {"line1": "Road 1", "city": "Delhi"},
        "bank_account": {"ifsc": "HDFC0001", "account_no": "111111"},
    }
    b2 = {
        "bidder_id": "B002",
        "entity_name": "Beta Ltd",
        "incorporation_date": "2020-01-01",
        "directors": [{"name": "Rajesh Sharma", "din": "01234567"}],
        "registered_address": {"line1": "Road 2", "city": "Mumbai"},
        "bank_account": {"ifsc": "SBIN0002", "account_no": "222222"},
    }

    anomalies = _detect_anomalies(b1, [b1, b2])
    overlap = [a for a in anomalies if a["anomaly_type"] == "director_overlap"]
    assert len(overlap) == 1
    assert overlap[0]["severity"] == "critical"
    assert "B002" in overlap[0]["related_bidders"]
    assert "Rajesh Sharma" in overlap[0]["description"]


def test_address_overlap_detection():
    """Verify identical registered address generates an address_overlap anomaly."""
    addr = {"line1": "Plot 42, Okhla", "city": "New Delhi", "pincode": "110020"}
    b1 = {
        "bidder_id": "B001",
        "entity_name": "Alpha Corp",
        "incorporation_date": "2020-01-01",
        "directors": [],
        "registered_address": addr,
        "bank_account": {"ifsc": "HDFC0001", "account_no": "111111"},
    }
    b2 = {
        "bidder_id": "B002",
        "entity_name": "Beta Ltd",
        "incorporation_date": "2020-01-01",
        "directors": [],
        "registered_address": addr,
        "bank_account": {"ifsc": "SBIN0002", "account_no": "222222"},
    }

    anomalies = _detect_anomalies(b1, [b1, b2])
    overlap = [a for a in anomalies if a["anomaly_type"] == "address_overlap"]
    assert len(overlap) == 1
    assert overlap[0]["severity"] == "high"
    assert "B002" in overlap[0]["related_bidders"]


def test_bank_overlap_detection():
    """Verify shared IFSC + prefix generates a bank_overlap anomaly."""
    b1 = {
        "bidder_id": "B001",
        "entity_name": "Alpha Corp",
        "incorporation_date": "2020-01-01",
        "directors": [],
        "registered_address": {"line1": "Road 1"},
        "bank_account": {"ifsc": "HDFC0001234", "account_no": "50200011112222", "branch": "Okhla"},
    }
    b2 = {
        "bidder_id": "B002",
        "entity_name": "Beta Ltd",
        "incorporation_date": "2020-01-01",
        "directors": [],
        "registered_address": {"line1": "Road 2"},
        "bank_account": {"ifsc": "HDFC0001234", "account_no": "50200011113333", "branch": "Okhla"},
    }

    anomalies = _detect_anomalies(b1, [b1, b2])
    overlap = [a for a in anomalies if a["anomaly_type"] == "bank_overlap"]
    assert len(overlap) == 1
    assert overlap[0]["severity"] == "high"
    assert "B002" in overlap[0]["related_bidders"]


def test_phone_overlap_detection():
    """Verify shared director phone generates a phone_overlap anomaly."""
    b1 = {
        "bidder_id": "B001",
        "entity_name": "Alpha Corp",
        "incorporation_date": "2020-01-01",
        "directors": [{"name": "D1", "phone": "+919811122233"}],
        "registered_address": {"line1": "Road 1"},
        "bank_account": {},
    }
    b2 = {
        "bidder_id": "B002",
        "entity_name": "Beta Ltd",
        "incorporation_date": "2020-01-01",
        "directors": [{"name": "D2", "phone": "+919811122233"}],
        "registered_address": {"line1": "Road 2"},
        "bank_account": {},
    }

    anomalies = _detect_anomalies(b1, [b1, b2])
    overlap = [a for a in anomalies if a["anomaly_type"] == "phone_overlap"]
    assert len(overlap) == 1
    assert "B002" in overlap[0]["related_bidders"]


def test_shell_company_detection():
    """Verify newly incorporated company (<1 yr) with no GST filings is flagged as a shell company."""
    recent_date = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")
    bidder = {
        "bidder_id": "B007",
        "entity_name": "Shell Front Ltd",
        "incorporation_date": recent_date,
        "directors": [],
        "registered_address": {"line1": "Suite 1"},
        "bank_account": {},
        "gst_filing_history": [],
    }

    anomalies = _detect_anomalies(bidder, [bidder])
    shell = [a for a in anomalies if a["anomaly_type"] == "shell_company"]
    assert len(shell) == 1
    assert shell[0]["severity"] == "critical"
