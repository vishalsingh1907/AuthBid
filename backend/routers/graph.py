"""
SIH26100 — Graph Router
Endpoints for bidder entity graph and cross-bidder collusion network.
"""
from fastapi import APIRouter
from mock_apis.synthetic_data import get_all_bidders, get_bidder_by_id
import json

router = APIRouter(prefix="/api/graph", tags=["Graph Analysis"])


def _build_bidder_graph(bidder: dict) -> dict:
    """Build entity graph for a single bidder."""
    nodes = []
    edges = []

    # Bidder node (center)
    bidder_node_id = f"bidder-{bidder['bidder_id']}"
    nodes.append({
        "id": bidder_node_id,
        "label": bidder["entity_name"],
        "type": "bidder",
        "properties": {
            "bid_amount": bidder["bid_amount"],
            "entity_type": bidder["entity_type"],
        },
    })

    # Director nodes
    for d in bidder.get("directors", []):
        dir_id = f"dir-{d.get('din') or d.get('pan')}"
        nodes.append({
            "id": dir_id,
            "label": d["name"],
            "type": "director",
            "properties": {"din": d.get("din"), "pan": d.get("pan"), "phone": d.get("phone")},
        })
        edges.append({
            "source": bidder_node_id,
            "target": dir_id,
            "relationship": "HAS_DIRECTOR",
        })

    # Address node
    addr = bidder.get("registered_address", {})
    addr_id = f"addr-{addr.get('pincode', '')}-{addr.get('line1', '')[:10]}"
    nodes.append({
        "id": addr_id,
        "label": f"{addr.get('line1', '')}, {addr.get('city', '')}",
        "type": "address",
        "properties": addr,
    })
    edges.append({
        "source": bidder_node_id,
        "target": addr_id,
        "relationship": "REGISTERED_AT",
    })

    # Bank node
    bank = bidder.get("bank_account", {})
    if bank:
        bank_id = f"bank-{bank.get('ifsc', '')}"
        nodes.append({
            "id": bank_id,
            "label": f"{bank.get('bank_name', '')} ({bank.get('branch', '')})",
            "type": "bank",
            "properties": bank,
        })
        edges.append({
            "source": bidder_node_id,
            "target": bank_id,
            "relationship": "BANKS_WITH",
        })

    # Identifier nodes
    for id_type, id_val in [("PAN", bidder.get("pan")), ("GSTIN", bidder.get("gstin")), ("CIN", bidder.get("cin")), ("Udyam", bidder.get("udyam_no"))]:
        if id_val:
            id_node = f"id-{id_type}-{id_val}"
            nodes.append({
                "id": id_node,
                "label": f"{id_type}: {id_val}",
                "type": "identifier",
                "properties": {"type": id_type, "value": id_val},
            })
            edges.append({
                "source": bidder_node_id,
                "target": id_node,
                "relationship": "HAS_IDENTIFIER",
            })

    return {"nodes": nodes, "edges": edges}


def _build_cross_bidder_graph(bidders: list[dict]) -> dict:
    """
    Build the cross-bidder collusion detection graph.
    This is the CORE differentiator — OSINT-style entity resolution.
    """
    nodes = []
    edges = []
    clusters = []

    # Track shared entities for collusion detection
    director_to_bidders: dict[str, list[str]] = {}
    address_to_bidders: dict[str, list[str]] = {}
    bank_to_bidders: dict[str, list[str]] = {}
    phone_to_bidders: dict[str, list[str]] = {}

    for bidder in bidders:
        bid_id = bidder["bidder_id"]

        # Calculate risk level based on anomalies
        anomaly_tags = bidder.get("anomalies", [])
        if "SHELL_COMPANY" in anomaly_tags or "COLLUSION_RING_1" in anomaly_tags:
            risk = "critical"
        elif "COLLUSION_RING_2" in anomaly_tags or "PREVIOUSLY_DEBARRED" in anomaly_tags:
            risk = "high"
        elif "GST_FILING_GAP" in anomaly_tags or "EXPIRED_MSME" in anomaly_tags or "PAN_NAME_MISMATCH" in anomaly_tags:
            risk = "medium"
        else:
            risk = "low"

        # Bidder node
        nodes.append({
            "id": f"bidder-{bid_id}",
            "label": bidder["entity_name"],
            "type": "bidder",
            "risk_level": risk,
            "properties": {
                "bid_amount": bidder["bid_amount"],
                "entity_type": bidder["entity_type"],
                "bidder_id": bid_id,
            },
        })

        # Track directors
        for d in bidder.get("directors", []):
            key = d.get("din") or d.get("pan")
            if key:
                if key not in director_to_bidders:
                    director_to_bidders[key] = []
                    nodes.append({
                        "id": f"dir-{key}",
                        "label": d["name"],
                        "type": "director",
                        "properties": {"din": d.get("din"), "pan": d.get("pan")},
                    })
                director_to_bidders[key].append(bid_id)
                edges.append({
                    "source": f"bidder-{bid_id}",
                    "target": f"dir-{key}",
                    "relationship": "HAS_DIRECTOR",
                    "is_suspicious": False,
                })

        # Track addresses
        addr = bidder.get("registered_address", {})
        addr_key = json.dumps(addr, sort_keys=True)
        addr_short = f"{addr.get('pincode', '')}-{addr.get('line1', '')[:15]}"
        if addr_key not in address_to_bidders:
            address_to_bidders[addr_key] = []
            nodes.append({
                "id": f"addr-{addr_short}",
                "label": f"{addr.get('line1', '')}, {addr.get('city', '')}",
                "type": "address",
                "properties": addr,
            })
        address_to_bidders[addr_key].append(bid_id)
        edges.append({
            "source": f"bidder-{bid_id}",
            "target": f"addr-{addr_short}",
            "relationship": "REGISTERED_AT",
            "is_suspicious": False,
        })

        # Track bank branches
        bank = bidder.get("bank_account", {})
        if bank.get("ifsc"):
            bank_key = bank["ifsc"]
            if bank_key not in bank_to_bidders:
                bank_to_bidders[bank_key] = []
                nodes.append({
                    "id": f"bank-{bank_key}",
                    "label": f"{bank.get('bank_name', '')} ({bank.get('branch', '')})",
                    "type": "bank",
                    "properties": bank,
                })
            bank_to_bidders[bank_key].append(bid_id)
            edges.append({
                "source": f"bidder-{bid_id}",
                "target": f"bank-{bank_key}",
                "relationship": "BANKS_WITH",
                "is_suspicious": False,
            })

        # Track phone numbers
        for d in bidder.get("directors", []):
            if d.get("phone"):
                if d["phone"] not in phone_to_bidders:
                    phone_to_bidders[d["phone"]] = []
                phone_to_bidders[d["phone"]].append(bid_id)

    # Mark suspicious edges (shared entities between bidders)
    for key, bids in director_to_bidders.items():
        if len(bids) > 1:
            for edge in edges:
                if edge["target"] == f"dir-{key}":
                    edge["is_suspicious"] = True

    for key, bids in address_to_bidders.items():
        if len(bids) > 1:
            addr_short = f"{json.loads(key).get('pincode', '')}-{json.loads(key).get('line1', '')[:15]}"
            for edge in edges:
                if edge["target"] == f"addr-{addr_short}":
                    edge["is_suspicious"] = True

    for key, bids in bank_to_bidders.items():
        if len(bids) > 1:
            for edge in edges:
                if edge["target"] == f"bank-{key}":
                    edge["is_suspicious"] = True

    # Build collusion clusters
    # Simple connected-component analysis
    bidder_links: dict[str, set[str]] = {b["bidder_id"]: set() for b in bidders}
    for key, bids in director_to_bidders.items():
        if len(bids) > 1:
            for b1 in bids:
                for b2 in bids:
                    if b1 != b2:
                        bidder_links[b1].add(b2)

    for key, bids in address_to_bidders.items():
        if len(bids) > 1:
            for b1 in bids:
                for b2 in bids:
                    if b1 != b2:
                        bidder_links[b1].add(b2)

    for phone, bids in phone_to_bidders.items():
        if len(bids) > 1:
            for b1 in bids:
                for b2 in bids:
                    if b1 != b2:
                        bidder_links[b1].add(b2)

    # Find connected components (collusion rings)
    visited = set()
    cluster_id = 0
    for bid_id in bidder_links:
        if bid_id not in visited and bidder_links[bid_id]:
            # BFS
            cluster_members = set()
            queue = [bid_id]
            while queue:
                current = queue.pop(0)
                if current in visited:
                    continue
                visited.add(current)
                cluster_members.add(current)
                for neighbor in bidder_links[current]:
                    if neighbor not in visited:
                        queue.append(neighbor)

            if len(cluster_members) > 1:
                cluster_id += 1
                member_names = [next(b["entity_name"] for b in bidders if b["bidder_id"] == m) for m in cluster_members]
                # Determine shared indicators
                shared_indicators = []
                for key, bids in director_to_bidders.items():
                    if len(set(bids) & cluster_members) > 1:
                        shared_indicators.append(f"Shared director (DIN/PAN: {key})")
                for key, bids in address_to_bidders.items():
                    if len(set(bids) & cluster_members) > 1:
                        shared_indicators.append("Shared registered address")

                clusters.append({
                    "cluster_id": f"CLU-{cluster_id:03d}",
                    "members": list(cluster_members),
                    "member_names": member_names,
                    "size": len(cluster_members),
                    "risk_level": "critical",
                    "shared_indicators": shared_indicators,
                    "description": f"Potential bid-rigging ring: {', '.join(member_names)}",
                })

    return {"nodes": nodes, "edges": edges, "clusters": clusters}


@router.get("/bidder/{bidder_id}")
async def get_bidder_graph(bidder_id: str):
    """Get entity graph for a single bidder."""
    bidder = get_bidder_by_id(bidder_id)
    if not bidder:
        return {"success": False, "error": f"Bidder {bidder_id} not found"}

    graph = _build_bidder_graph(bidder)
    return {"success": True, "data": graph}


@router.get("/collusion/{tender_id:path}")
async def get_collusion_graph(tender_id: str):
    """
    Get the cross-bidder collusion detection graph.
    This is the SHOWSTOPPER endpoint — returns the full network
    with suspicious clusters highlighted.
    """
    bidders = get_all_bidders()
    graph = _build_cross_bidder_graph(bidders)

    return {
        "success": True,
        "data": {
            "tender_id": tender_id,
            **graph,
            "analysis_summary": {
                "total_bidders": len(bidders),
                "total_nodes": len(graph["nodes"]),
                "total_edges": len(graph["edges"]),
                "suspicious_edges": sum(1 for e in graph["edges"] if e.get("is_suspicious")),
                "collusion_clusters": len(graph["clusters"]),
                "high_risk_bidders": sum(1 for n in graph["nodes"] if n.get("risk_level") in ["high", "critical"] and n["type"] == "bidder"),
            },
        },
    }
