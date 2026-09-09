from models.database import (
    append_audit_entry,
    verify_audit_chain,
    tamper_audit_entry,
    restore_audit_trail,
)


def test_genesis_block_and_chaining():
    """Verify genesis block prev_hash is GENESIS and subsequent blocks link to previous hash."""
    e1 = append_audit_entry("test_agent", "ACTION_1", {"key": "v1"}, {"status": "ok"})
    assert e1["prev_hash"] == "GENESIS"
    assert len(e1["current_hash"]) == 64

    e2 = append_audit_entry("test_agent", "ACTION_2", {"key": "v2"}, {"status": "ok"})
    assert e2["prev_hash"] == e1["current_hash"]

    e3 = append_audit_entry("test_agent", "ACTION_3", {"key": "v3"}, {"status": "ok"})
    assert e3["prev_hash"] == e2["current_hash"]

    verification = verify_audit_chain()
    assert verification["valid"] is True
    assert verification["entries_checked"] == 3


def test_tamper_detection():
    """Verify that tampering an entry causes chain verification to fail with broken_at."""
    append_audit_entry("agent_1", "INIT", {"data": 1}, {"result": "ok"})
    e2 = append_audit_entry("agent_2", "PROCESS", {"data": 2}, {"result": "ok"})
    e3 = append_audit_entry("agent_3", "FINISH", {"data": 3}, {"result": "ok"})

    verification_before = verify_audit_chain()
    assert verification_before["valid"] is True

    # Tamper with the second entry
    tamper_res = tamper_audit_entry(e2["step_id"])
    assert tamper_res["success"] is True

    # Verification must fail at the tampered block or immediately following block
    verification_after = verify_audit_chain()
    assert verification_after["valid"] is False
    assert "broken_at" in verification_after
    assert verification_after["broken_at"] in [e2["step_id"], e3["step_id"]]


def test_restore_chain():
    """Verify that restore_audit_trail repairs the chain integrity."""
    append_audit_entry("agent_1", "INIT", {"data": 1}, {"result": "ok"})
    append_audit_entry("agent_2", "PROCESS", {"data": 2}, {"result": "ok"})
    append_audit_entry("agent_3", "FINISH", {"data": 3}, {"result": "ok"})

    tamper_audit_entry()
    assert verify_audit_chain()["valid"] is False

    restore_res = restore_audit_trail()
    assert restore_res["success"] is True

    verification_restored = verify_audit_chain()
    assert verification_restored["valid"] is True
    assert verification_restored["entries_checked"] == 3
