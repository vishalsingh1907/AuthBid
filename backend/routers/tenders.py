"""
SIH26100 — Tenders Router
CRUD operations for tender management.
"""
from fastapi import APIRouter, HTTPException
from models.database import store_tender, get_tender, get_all_tenders, get_all_results_for_tender
from mock_apis.synthetic_data import SAMPLE_TENDER, get_all_bidders

router = APIRouter(prefix="/api/tenders", tags=["Tenders"])


@router.on_event("startup")
async def seed_sample_tender():
    """Seed the sample tender on startup."""
    store_tender(SAMPLE_TENDER)


@router.get("")
@router.get("/")
async def list_tenders():
    """List all tenders."""
    tenders = get_all_tenders()
    if not tenders:
        # Seed on first call
        store_tender(SAMPLE_TENDER)
        tenders = get_all_tenders()

    result = []
    for t in tenders:
        bidders = [b for b in get_all_bidders()]
        results = get_all_results_for_tender(t["tender_id"])
        completed = sum(1 for r in results if r.get("status") == "completed")

        result.append({
            **t,
            "bidder_count": len(bidders),
            "verified_count": completed,
            "verification_status": "completed" if completed == len(bidders) and completed > 0
                else "in_progress" if completed > 0
                else "pending",
        })

    return {"success": True, "data": result}


@router.get("/{tender_id:path}")
async def get_tender_detail(tender_id: str):
    """Get tender details with bidder list."""
    tender = get_tender(tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found")

    bidders = get_all_bidders()
    results = get_all_results_for_tender(tender_id)

    bidder_summaries = []
    for b in bidders:
        result = next((r for r in results if r.get("bidder_id") == b["bidder_id"]), None)
        bidder_summaries.append({
            "bidder_id": b["bidder_id"],
            "entity_name": b["entity_name"],
            "trade_name": b.get("trade_name"),
            "entity_type": b["entity_type"],
            "bid_amount": b["bid_amount"],
            "risk_score": result.get("risk_score", {}).get("overall_score") if result else None,
            "risk_level": result.get("risk_score", {}).get("risk_level") if result else None,
            "verification_status": result.get("status", "pending") if result else "pending",
            "anomaly_count": len(result.get("anomalies", [])) if result else 0,
        })

    return {
        "success": True,
        "data": {
            **tender,
            "bidders": bidder_summaries,
            "bidder_count": len(bidders),
        },
    }


@router.get("/{tender_id:path}/checklist")
async def get_ai_checklist(tender_id: str):
    """Get AI-generated compliance checklist from tender document."""
    tender = get_tender(tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail=f"Tender {tender_id} not found")

    criteria = tender.get("eligibility_criteria", {})

    # AI-generated checklist (in production, this comes from the tender_parser agent)
    checklist = [
        {
            "id": "CHK-001",
            "category": "Registration",
            "requirement": "Valid GST Registration",
            "description": "Bidder must have active GST registration",
            "mandatory": True,
            "source": "Tender Clause 4.1",
            "verification_method": "GST Portal API",
        },
        {
            "id": "CHK-002",
            "category": "Registration",
            "requirement": "Valid PAN",
            "description": "Bidder must have valid and active PAN",
            "mandatory": True,
            "source": "Tender Clause 4.1",
            "verification_method": "PAN NSDL API",
        },
        {
            "id": "CHK-003",
            "category": "Financial",
            "requirement": f"Minimum Annual Turnover: ₹{criteria.get('min_annual_turnover', 0):,.0f}",
            "description": f"Average annual turnover in last 3 FYs must be ≥ ₹{criteria.get('min_annual_turnover', 0):,.0f}",
            "mandatory": True,
            "source": "Tender Clause 5.2",
            "verification_method": "ITR + GST Returns Cross-check",
        },
        {
            "id": "CHK-004",
            "category": "Experience",
            "requirement": f"Minimum {criteria.get('min_experience_years', 0)} Years Experience",
            "description": "Entity must be incorporated/operational for the required period",
            "mandatory": True,
            "source": "Tender Clause 5.1",
            "verification_method": "MCA21 Incorporation Date",
        },
        {
            "id": "CHK-005",
            "category": "Make in India",
            "requirement": f"Minimum {criteria.get('make_in_india_min_percent', 0)}% Domestic Value Addition",
            "description": "Products must meet Make in India threshold",
            "mandatory": criteria.get("make_in_india_required", False),
            "source": "Tender Clause 6.1",
            "verification_method": "OEM Declaration + Self-Certification",
        },
        {
            "id": "CHK-006",
            "category": "Certification",
            "requirement": "Required Certifications",
            "description": f"Must hold: {', '.join(criteria.get('required_certifications', []))}",
            "mandatory": True,
            "source": "Tender Clause 5.4",
            "verification_method": "Document Upload + Verification",
        },
        {
            "id": "CHK-007",
            "category": "Authorization",
            "requirement": "OEM Authorization",
            "description": "Must have valid OEM authorization for the products being supplied",
            "mandatory": criteria.get("oem_authorization_required", False),
            "source": "Tender Clause 5.5",
            "verification_method": "OEM Authorization Letter",
        },
        {
            "id": "CHK-008",
            "category": "Compliance",
            "requirement": "EPFO Registration",
            "description": "Must have valid EPFO registration",
            "mandatory": criteria.get("epfo_registration_required", False),
            "source": "Tender Clause 5.6",
            "verification_method": "EPFO Portal Verification",
        },
        {
            "id": "CHK-009",
            "category": "Financial",
            "requirement": f"EMD: ₹{criteria.get('emd_amount', 0):,.0f}",
            "description": "Earnest Money Deposit must be submitted",
            "mandatory": True,
            "source": "Tender Clause 3.1",
            "verification_method": "Payment Verification",
            "mse_exemption": criteria.get("mse_exemption", False),
        },
        {
            "id": "CHK-010",
            "category": "Integrity",
            "requirement": "Not Blacklisted/Debarred",
            "description": "Bidder must not be on any government debarment list",
            "mandatory": True,
            "source": "Tender Clause 4.5",
            "verification_method": "Blacklist Database Check",
        },
    ]

    return {
        "success": True,
        "data": {
            "tender_id": tender_id,
            "checklist": checklist,
            "total_checks": len(checklist),
            "mandatory_checks": sum(1 for c in checklist if c["mandatory"]),
            "generated_by": "AI — Tender Document Parser",
        },
    }
