"""
SIH26100 — Bidders Router
Bidder profile and document management endpoints.
"""
from fastapi import APIRouter, HTTPException
from mock_apis.synthetic_data import get_bidder_by_id, get_all_bidders
from models.database import get_verification_result

router = APIRouter(prefix="/api/bidders", tags=["Bidders"])


@router.get("")
@router.get("/")
async def list_bidders():
    """List all bidders in the system."""
    bidders = get_all_bidders()
    return {
        "success": True,
        "data": [
            {
                "bidder_id": b["bidder_id"],
                "entity_name": b["entity_name"],
                "trade_name": b.get("trade_name"),
                "entity_type": b["entity_type"],
                "pan": b["pan"],
                "gstin": b["gstin"],
                "bid_amount": b["bid_amount"],
                "msme_category": b.get("msme_category"),
            }
            for b in bidders
        ],
    }


@router.get("/{bidder_id}")
async def get_bidder_detail(bidder_id: str):
    """Get full bidder profile with all identifiers and attributes."""
    bidder = get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"Bidder {bidder_id} not found")

    return {
        "success": True,
        "data": {
            "bidder_id": bidder["bidder_id"],
            "entity_name": bidder["entity_name"],
            "trade_name": bidder.get("trade_name"),
            "entity_type": bidder["entity_type"],
            "identifiers": {
                "pan": bidder["pan"],
                "gstin": bidder["gstin"],
                "cin": bidder.get("cin"),
                "udyam_no": bidder.get("udyam_no"),
            },
            "incorporation_date": bidder["incorporation_date"],
            "registered_address": bidder["registered_address"],
            "directors": bidder["directors"],
            "bank_account": bidder["bank_account"],
            "gst_status": bidder["gst_status"],
            "annual_turnover": bidder.get("annual_turnover", []),
            "msme_category": bidder.get("msme_category"),
            "msme_valid_until": bidder.get("msme_valid_until"),
            "certifications": bidder.get("certifications", []),
            "epfo_registered": bidder.get("epfo_registered"),
            "bid_amount": bidder["bid_amount"],
            "make_in_india_percent": bidder.get("make_in_india_percent"),
            "oem_authorization": bidder.get("oem_authorization"),
            "oem_name": bidder.get("oem_name"),
        },
    }


@router.get("/{bidder_id}/verification/{tender_id}")
async def get_bidder_verification(bidder_id: str, tender_id: str):
    """Get verification results for a bidder in a specific tender."""
    result = get_verification_result(bidder_id, tender_id)
    if not result:
        return {
            "success": True,
            "data": {
                "bidder_id": bidder_id,
                "tender_id": tender_id,
                "status": "pending",
                "message": "Verification not yet run. Trigger via /api/verification/run",
            },
        }

    return {"success": True, "data": result}
