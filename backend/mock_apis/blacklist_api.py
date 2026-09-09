"""
SIH26100 — Mock Blacklist / Debarment API
Simulates checking against government debarment lists.
"""
from fastapi import APIRouter, HTTPException
from mock_apis.synthetic_data import BLACKLIST_DATABASE, get_all_bidders

router = APIRouter(prefix="/api/v1/blacklist", tags=["Blacklist Verification"])


@router.get("/check/{identifier}")
async def check_blacklist(identifier: str):
    """
    Check if an entity is on any debarment/blacklist.
    Identifier can be PAN, GSTIN, or entity name.
    """
    matches = []
    for entry in BLACKLIST_DATABASE:
        if (
            entry["pan"] == identifier
            or entry.get("gstin") == identifier
            or identifier.lower() in entry["entity_name"].lower()
        ):
            matches.append(entry)

    return {
        "success": True,
        "data": {
            "identifier": identifier,
            "is_blacklisted": any(m["status"] == "Active" for m in matches),
            "has_history": len(matches) > 0,
            "matches": matches,
            "total_matches": len(matches),
        },
        "source": "BLACKLIST_DB_MOCK",
        "timestamp": "2026-09-09T06:00:00+05:30",
    }


@router.get("/check-related/{pan}")
async def check_related_entities(pan: str):
    """
    Check if any related entities (shared directors) are blacklisted.
    This is critical for detecting front companies of debarred entities.
    """
    # Find the bidder
    target = None
    for b in get_all_bidders():
        if b["pan"] == pan:
            target = b
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"PAN {pan} not found")

    # Get all director PANs/DINs
    director_identifiers = set()
    for d in target.get("directors", []):
        if d.get("din"):
            director_identifiers.add(d["din"])
        if d.get("pan"):
            director_identifiers.add(d["pan"])

    # Check each director against all blacklisted entities
    related_flags = []
    for entry in BLACKLIST_DATABASE:
        bl_pan = entry["pan"]
        # Find the blacklisted entity's directors
        for b in get_all_bidders():
            if b["pan"] == bl_pan:
                for d in b.get("directors", []):
                    if d.get("din") in director_identifiers or d.get("pan") in director_identifiers:
                        related_flags.append({
                            "blacklisted_entity": entry["entity_name"],
                            "relationship": f"Shared director: {d['name']}",
                            "debarment_status": entry["status"],
                            "debarment_reason": entry["reason"],
                        })

    return {
        "success": True,
        "data": {
            "pan": pan,
            "entity_name": target["entity_name"],
            "has_related_blacklisted": len(related_flags) > 0,
            "related_flags": related_flags,
        },
        "source": "BLACKLIST_DB_MOCK",
    }
