from routers.verification import _calculate_risk_score


def test_clean_bidder_zero_risk():
    """Verify that a bidder with all passing checks and no anomalies gets score 0 and low risk."""
    checks = [{"check_name": f"CHK-{i}", "result": "pass", "category": "General"} for i in range(10)]
    anomalies = []
    bidder = {"annual_turnover": [{"year": "FY24", "amount": 1000}, {"year": "FY25", "amount": 1200}]}

    result = _calculate_risk_score(checks, anomalies, bidder)
    assert result["overall_score"] == 0.0
    assert result["risk_level"] == "low"
    assert result["components"]["cross_source_consistency"] == 0.0
    assert result["components"]["collusion_indicators"] == 0.0
    assert result["components"]["financial_health"] == 0.0
    assert result["components"]["document_integrity"] == 0.0
    assert result["components"]["blacklist_proximity"] == 0.0


def test_consistency_weight_contribution():
    """Verify that failed checks contribute with 30% weight."""
    # 10 checks, all fail -> ((10*100)/10)*0.3 = 30.0 points
    checks = [{"check_name": f"CHK-{i}", "result": "fail", "category": "General"} for i in range(10)]
    anomalies = []
    bidder = {"annual_turnover": [{"year": "FY24", "amount": 1000}, {"year": "FY25", "amount": 1200}]}

    result = _calculate_risk_score(checks, anomalies, bidder)
    assert result["overall_score"] == 30.0
    assert result["components"]["cross_source_consistency"] == 100.0


def test_collusion_weight_contribution():
    """Verify that 4 collusion anomalies cap at 100 raw score and contribute 25 points (25% weight)."""
    checks = [{"check_name": "CHK-1", "result": "pass", "category": "General"}]
    anomalies = [
        {"anomaly_type": "director_overlap"},
        {"anomaly_type": "address_overlap"},
        {"anomaly_type": "bank_overlap"},
        {"anomaly_type": "phone_overlap"},
    ]
    bidder = {"annual_turnover": [{"year": "FY24", "amount": 1000}, {"year": "FY25", "amount": 1200}]}

    result = _calculate_risk_score(checks, anomalies, bidder)
    assert result["overall_score"] == 25.0
    assert result["components"]["collusion_indicators"] == 100.0


def test_financial_weight_contribution():
    """Verify missing turnover contributes 80 raw score * 0.20 = 16.0 points."""
    checks = [{"check_name": "CHK-1", "result": "pass", "category": "General"}]
    anomalies = []
    bidder = {"annual_turnover": []}

    result = _calculate_risk_score(checks, anomalies, bidder)
    assert result["overall_score"] == 16.0
    assert result["components"]["financial_health"] == 80.0


def test_document_integrity_contribution():
    """Verify shell company (50) + filing gaps (30) contribute (80 * 0.15) = 12.0 points."""
    checks = [{"check_name": "CHK-1", "result": "pass", "category": "General"}]
    anomalies = [
        {"anomaly_type": "shell_company"},
        {"anomaly_type": "gst_filing_gap"},
    ]
    bidder = {"annual_turnover": [{"year": "FY24", "amount": 1000}, {"year": "FY25", "amount": 1200}]}

    result = _calculate_risk_score(checks, anomalies, bidder)
    assert result["overall_score"] == 12.0
    assert result["components"]["document_integrity"] == 80.0


def test_blacklist_proximity_contribution():
    """Verify active blacklist failure contributes 100 raw score * 0.10 = 10.0 points."""
    checks = [{"check_name": "CHK-BL", "result": "fail", "category": "Blacklist"}]
    anomalies = []
    bidder = {"annual_turnover": [{"year": "FY24", "amount": 1000}, {"year": "FY25", "amount": 1200}]}

    result = _calculate_risk_score(checks, anomalies, bidder)
    assert result["overall_score"] == 40.0  # 30 from failed check + 10 from blacklist
    assert result["components"]["blacklist_proximity"] == 100.0


def test_risk_level_thresholds():
    """Verify the risk level cutoffs: critical >= 70, high >= 45, medium >= 20, low < 20."""
    checks = [{"check_name": "CHK-1", "result": "pass", "category": "General"}]
    bidder = {"annual_turnover": [{"year": "FY24", "amount": 1000}, {"year": "FY25", "amount": 1200}]}

    # 1 anomaly -> 25 raw collusion -> 6.25 points -> low
    r_low = _calculate_risk_score(checks, [{"anomaly_type": "director_overlap"}], bidder)
    assert r_low["overall_score"] == 6.2
    assert r_low["risk_level"] == "low"

    # 4 anomalies -> 25 points -> medium
    anom_4 = [{"anomaly_type": "director_overlap"} for _ in range(4)]
    r_med = _calculate_risk_score(checks, anom_4, bidder)
    assert r_med["overall_score"] == 25.0
    assert r_med["risk_level"] == "medium"
