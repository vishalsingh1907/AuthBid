"""
SIH26100 — Mock Udyam (MSME) Verification API
Simulates the Udyam Registration portal verification.
"""
from fastapi import APIRouter, HTTPException
from mock_apis.synthetic_data import get_all_bidders

router = APIRouter(prefix="/api/v1/udyam", tags=["MSME Verification"])


def _find_by_udyam(udyam_no: str):
    for b in get_all_bidders():
        if b.get("udyam_no") == udyam_no:
            return b
    return None


@router.get("/verify/{udyam_no}")
async def verify_udyam(udyam_no: str):
    """Verify Udyam Registration Number and return MSME details."""
    bidder = _find_by_udyam(udyam_no)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"Udyam {udyam_no} not found")

    # Check if MSME registration is expired
    from datetime import datetime
    valid_until = bidder.get("msme_valid_until")
    is_valid = True
    if valid_until:
        is_valid = datetime.strptime(valid_until, "%Y-%m-%d") > datetime.now()

    # Get latest turnover for category validation
    turnovers = bidder.get("annual_turnover", [])
    latest_turnover = turnovers[-1]["amount"] if turnovers else 0

    # MSME category thresholds (as per Udyam guidelines)
    category_limits = {
        "Micro": {"investment": 10000000, "turnover": 50000000},
        "Small": {"investment": 100000000, "turnover": 500000000},
        "Medium": {"investment": 500000000, "turnover": 2500000000},
    }

    category = bidder.get("msme_category")
    category_valid = True
    if category and latest_turnover:
        limit = category_limits.get(category, {}).get("turnover", float("inf"))
        category_valid = latest_turnover <= limit

    return {
        "success": True,
        "data": {
            "udyam_no": udyam_no,
            "enterprise_name": bidder["entity_name"],
            "category": category,
            "registration_date": bidder["incorporation_date"],
            "valid_until": valid_until,
            "is_valid": is_valid,
            "category_valid": category_valid,
            "pan_linked": bidder["pan"],
            "registered_address": bidder["registered_address"],
            "nic_code": "26200",  # Computer hardware manufacturing
            "social_category": "General",
            "gender": "Not Applicable",
            "investment_in_plant": 15000000 if category == "Small" else 5000000,
            "latest_turnover": latest_turnover,
        },
        "source": "UDYAM_PORTAL_MOCK",
        "timestamp": "2026-09-09T06:00:00+05:30",
    }
