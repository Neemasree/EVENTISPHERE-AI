from flask import Blueprint, jsonify, request
from agents.ticket_agent import verify, get_stats

tickets_bp = Blueprint("tickets", __name__)

@tickets_bp.route("/verify", methods=["POST"])
def verify_ticket():
    """POST /tickets/verify  { ticketId, gate }"""
    data      = request.get_json(force=True) or {}
    ticket_id = data.get("ticketId", "")
    gate      = data.get("gate", "Gate A")
    if not ticket_id:
        return jsonify({"error": "ticketId required"}), 400
    result = verify(ticket_id, gate)
    return jsonify(result), 200 if result["status"] == "verified" else 400

@tickets_bp.route("/stats", methods=["GET"])
def ticket_stats():
    return jsonify(get_stats())

@tickets_bp.route("/scan-demo", methods=["GET"])
def scan_demo():
    """Scan a random valid ticket for demo purposes."""
    from agents.ticket_agent import TICKET_REGISTRY, SCANNED_TICKETS
    import random
    unscanned = [tid for tid in TICKET_REGISTRY if tid not in SCANNED_TICKETS]
    if not unscanned:
        return jsonify({"status": "invalid", "reason": "All tickets scanned"}), 200
    tid    = random.choice(unscanned)
    result = verify(tid, "Gate A")
    return jsonify(result)
