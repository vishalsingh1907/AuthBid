"""
SIH26100 — Mock MCA21 (Ministry of Corporate Affairs) API
Simulates company/director data from the MCA21 portal.
"""
from fastapi import APIRouter, HTTPException
from mock_apis.synthetic_data import get_all_bidders

router = APIRouter(prefix="/api/v1/mca", tags=["MCA21 Verification"])


def _find_by_cin(cin: str):
    for b in get_all_bidders():
        if b.get("cin") == cin:
            return b
    return None


@router.get("/company/{cin}")
async def get_company_details(cin: str):
    """Get company details from MCA21 by CIN."""
    bidder = _find_by_cin(cin)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"CIN {cin} not found")

    from datetime import datetime
    incorp_date = datetime.strptime(bidder["incorporation_date"], "%Y-%m-%d")
    age_days = (datetime.now() - incorp_date).days

    return {
        "success": True,
        "data": {
            "cin": cin,
            "company_name": bidder["entity_name"],
            "company_type": bidder["entity_type"],
            "date_of_incorporation": bidder["incorporation_date"],
            "company_age_days": age_days,
            "is_recently_incorporated": age_days < 365,  # Less than 1 year
            "status": "Active",
            "roc": cin[1:3],
            "authorized_capital": 10000000,
            "paid_up_capital": 1000000 if age_days < 180 else 5000000,  # Shell companies have low capital
            "registered_address": bidder["registered_address"],
            "email": bidder["directors"][0]["email"] if bidder["directors"] else None,
            "pan_linked": bidder["pan"],
            "gstin_linked": bidder["gstin"],
        },
        "source": "MCA21_MOCK",
        "timestamp": "2026-09-09T06:00:00+05:30",
    }


@router.get("/directors/{cin}")
async def get_directors(cin: str):
    """Get director details for a company from MCA21."""
    bidder = _find_by_cin(cin)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"CIN {cin} not found")

    directors = []
    for d in bidder.get("directors", []):
        directors.append({
            "din": d.get("din"),
            "name": d["name"],
            "pan": d["pan"],
            "designation": "Director",
            "date_of_appointment": bidder["incorporation_date"],
            "other_directorships": [],  # Would show cross-company links in production
        })

    return {
        "success": True,
        "data": {
            "cin": cin,
            "company_name": bidder["entity_name"],
            "directors": directors,
            "total_directors": len(directors),
        },
        "source": "MCA21_MOCK",
    }


@router.get("/director-search/{din}")
async def search_director(din: str):
    """Search for a director across all companies — key for collusion detection."""
    companies = []
    for b in get_all_bidders():
        for d in b.get("directors", []):
            if d.get("din") == din:
                companies.append({
                    "cin": b.get("cin"),
                    "company_name": b["entity_name"],
                    "bidder_id": b["bidder_id"],
                    "designation": "Director",
                })
                break

    if not companies:
        raise HTTPException(status_code=404, detail=f"DIN {din} not found")

    return {
        "success": True,
        "data": {
            "din": din,
            "director_name": next(
                (d["name"] for b in get_all_bidders() for d in b.get("directors", []) if d.get("din") == din),
                "Unknown"
            ),
            "companies": companies,
            "total_directorships": len(companies),
            "is_common_director": len(companies) > 1,  # KEY COLLUSION INDICATOR
        },
        "source": "MCA21_MOCK",
    }
