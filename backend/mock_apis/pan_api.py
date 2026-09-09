"""
SIH26100 — Mock PAN Verification API
Simulates the PAN verification (Protean/NSDL) service.
"""
from fastapi import APIRouter, HTTPException
from mock_apis.synthetic_data import get_bidder_by_pan

router = APIRouter(prefix="/api/v1/pan", tags=["PAN Verification"])


@router.get("/verify/{pan}")
async def verify_pan(pan: str):
    """Verify PAN and return holder details."""
    bidder = get_bidder_by_pan(pan)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"PAN {pan} not found")

    # Check for name mismatch anomaly
    pan_name = bidder.get("pan_registered_name", bidder["entity_name"])

    return {
        "success": True,
        "data": {
            "pan": pan,
            "name_on_pan": pan_name,
            "entity_name_declared": bidder["entity_name"],
            "name_match": pan_name == bidder["entity_name"],
            "pan_status": "Active",
            "pan_type": "Company" if bidder["entity_type"] in ["Private Limited Company", "Public Limited Company"] else "Firm/Individual",
            "aadhaar_linked": True,
            "last_itr_filed": "AY 2025-26",
            "itr_filing_status": "Filed",
        },
        "source": "PAN_NSDL_MOCK",
        "timestamp": "2026-09-09T06:00:00+05:30",
    }


@router.get("/itr-summary/{pan}")
async def get_itr_summary(pan: str):
    """Get ITR filing summary for cross-referencing with GST turnover."""
    bidder = get_bidder_by_pan(pan)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"PAN {pan} not found")

    turnover = bidder.get("annual_turnover", [])
    itr_data = []
    for t in turnover:
        itr_data.append({
            "assessment_year": f"AY {int(t['fy'][:4])+1}-{int(t['fy'][:4])+2}",
            "financial_year": t["fy"],
            "gross_total_income": int(t["amount"] * 0.12),  # ~12% profit margin
            "turnover_reported": t["amount"],
            "filing_date": f"{int(t['fy'][:4])+1}-07-{15}",
            "itr_form": "ITR-6" if "Company" in bidder["entity_type"] else "ITR-3",
        })

    return {
        "success": True,
        "data": {
            "pan": pan,
            "itr_records": itr_data,
        },
        "source": "PAN_NSDL_MOCK",
    }
