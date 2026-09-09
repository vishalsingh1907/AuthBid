"""
SIH26100 — Mock GST API
Simulates the GST public search API with synthetic bidder data.
"""
from fastapi import APIRouter, HTTPException
from mock_apis.synthetic_data import get_bidder_by_gstin, get_all_bidders

router = APIRouter(prefix="/api/v1/gst", tags=["GST Verification"])


@router.get("/search/{gstin}")
async def search_gstin(gstin: str):
    """Search taxpayer profile by GSTIN."""
    bidder = get_bidder_by_gstin(gstin)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"GSTIN {gstin} not found")

    return {
        "success": True,
        "data": {
            "gstin": bidder["gstin"],
            "legal_name": bidder["entity_name"],
            "trade_name": bidder["trade_name"],
            "taxpayer_type": bidder["entity_type"],
            "registration_date": bidder["gst_registration_date"],
            "status": bidder["gst_status"],
            "state_code": bidder["gstin"][:2],
            "pan_linked": bidder["pan"],
            "principal_address": bidder["registered_address"],
            "authorized_signatory": bidder["directors"][0]["name"] if bidder["directors"] else None,
        },
        "source": "GST_PORTAL_MOCK",
        "timestamp": "2026-09-09T06:00:00+05:30",
    }


@router.get("/filing-history/{gstin}")
async def get_filing_history(gstin: str):
    """Get GST filing history for a GSTIN."""
    bidder = get_bidder_by_gstin(gstin)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"GSTIN {gstin} not found")

    filings = bidder.get("gst_filing_history", [])
    filed_count = sum(1 for f in filings if f["status"] == "Filed")
    not_filed = sum(1 for f in filings if f["status"] == "Not Filed")

    return {
        "success": True,
        "data": {
            "gstin": gstin,
            "total_periods": len(filings),
            "filed": filed_count,
            "not_filed": not_filed,
            "compliance_rate": round(filed_count / max(len(filings), 1) * 100, 1),
            "filings": filings[-24:],  # Last 24 months
        },
        "source": "GST_PORTAL_MOCK",
    }


@router.get("/turnover/{gstin}")
async def get_turnover(gstin: str):
    """Get aggregate turnover from GST returns."""
    bidder = get_bidder_by_gstin(gstin)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"GSTIN {gstin} not found")

    filings = bidder.get("gst_filing_history", [])
    # Aggregate by financial year
    fy_totals = {}
    for f in filings:
        if f["status"] == "Filed":
            year = int(f["period"][:4])
            month = int(f["period"][5:7])
            fy = f"{year}-{str(year+1)[2:]}" if month >= 4 else f"{year-1}-{str(year)[2:]}"
            fy_totals[fy] = fy_totals.get(fy, 0) + f["taxable_value"]

    return {
        "success": True,
        "data": {
            "gstin": gstin,
            "gst_derived_turnover": fy_totals,
            "declared_turnover": {t["fy"]: t["amount"] for t in bidder.get("annual_turnover", [])},
        },
        "source": "GST_PORTAL_MOCK",
    }
