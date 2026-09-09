def test_full_pipeline_against_synthetic_12_bidders(client):
    """
    Integration test running the full verification pipeline against
    all 12 seeded synthetic bidders.
    """
    tender_id = "GEM/2026/B/4521897"

    # 1. Run full verification pipeline
    run_res = client.post(f"/api/verification/run/{tender_id}")
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["success"] is True
    assert run_data["data"]["bidders_verified"] == 12

    # Map results by bidder_id
    results_map = {r["bidder_id"]: r for r in run_data["data"]["results"]}

    # 2. Verify Collusion Ring 1 (B001, B003, B007)
    # B007 is a newly-formed shell company with director overlaps
    b007 = results_map["B007"]
    assert b007["risk_score"]["risk_level"] in ["high", "critical"]
    assert b007["risk_score"]["overall_score"] >= 60.0
    b007_anom_types = [a["anomaly_type"] for a in b007["anomalies"]]
    assert "shell_company" in b007_anom_types
    assert "director_overlap" in b007_anom_types

    # B001 and B003 have director and address overlaps
    b001 = results_map["B001"]
    b003 = results_map["B003"]
    assert "director_overlap" in [a["anomaly_type"] for a in b001["anomalies"]]
    assert "director_overlap" in [a["anomaly_type"] for a in b003["anomalies"]]
    assert "address_overlap" in [a["anomaly_type"] for a in b001["anomalies"]]

    # 3. Verify Collusion Ring 2 (B005, B009)
    b005 = results_map["B005"]
    b009 = results_map["B009"]
    b005_anom_types = [a["anomaly_type"] for a in b005["anomalies"]]
    b009_anom_types = [a["anomaly_type"] for a in b009["anomalies"]]
    assert "bank_overlap" in b005_anom_types or "phone_overlap" in b005_anom_types
    assert "bank_overlap" in b009_anom_types or "phone_overlap" in b009_anom_types

    # 4. Verify Clean Bidders (B002, B010, B012)
    for clean_id in ["B002", "B010", "B012"]:
        clean_res = results_map[clean_id]
        assert clean_res["risk_score"]["risk_level"] == "low"
        collusion_anoms = [
            a for a in clean_res["anomalies"]
            if a["anomaly_type"] in ["director_overlap", "address_overlap", "bank_overlap", "phone_overlap"]
        ]
        assert len(collusion_anoms) == 0

    # 5. Verify Audit Trail and Cryptographic Integrity
    audit_res = client.get("/api/verification/audit-trail")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["data"]["total_entries"] > 0
    assert audit_data["data"]["chain_integrity"]["valid"] is True
