from flask import Blueprint, jsonify, request
from models.data_store import get_all, get_one, insert_one, AGENTS, AGENT_MESSAGES
from utils.ai_engine import run_decision_engine
from datetime import datetime, timezone, timedelta
import uuid

agents_bp = Blueprint("agents", __name__)

def _derive_agent_status():
    """Derive live status for each agent from recent AGENT_MESSAGES activity."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    # Count messages sent by each agent in the last 5 minutes
    recent_counts: dict[str, int] = {}
    for m in AGENT_MESSAGES:
        try:
            ts = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
        except Exception:
            continue
        if ts >= cutoff:
            sender = m.get("from", "")
            recent_counts[sender] = recent_counts.get(sender, 0) + 1

    agents = get_all("agents", AGENTS)
    for agent in agents:
        aid   = agent["id"]
        count = recent_counts.get(aid, 0)
        # Derive status: active if sent messages recently, alert if high volume, idle otherwise
        if count >= 5:
            agent["status"] = "alert"
        elif count >= 1:
            agent["status"] = "active"
        else:
            agent["status"] = "idle"
        # Accumulate total messages processed
        total = sum(1 for m in AGENT_MESSAGES if m.get("from") == aid)
        if total > 0:
            agent["messagesProcessed"] = agent.get("messagesProcessed", 0) + total
    return agents


@agents_bp.route("/status", methods=["GET"])
def agents_status():
    return jsonify({"agents": _derive_agent_status()})

@agents_bp.route("/decisions", methods=["GET"])
def agent_decisions():
    decisions = run_decision_engine()
    return jsonify({"decisions": decisions})

@agents_bp.route("/message", methods=["POST"])
def agent_message():
    """POST /agents/message  { from, to, message, type }"""
    data = request.get_json(force=True) or {}
    msg = {
        "id":        str(uuid.uuid4()),
        "from":      data.get("from", "orchestrator"),
        "to":        data.get("to", "crowd"),
        "message":   data.get("message", ""),
        "type":      data.get("type", "info"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    insert_one("agent_messages", AGENT_MESSAGES, msg)
    return jsonify(msg), 201

@agents_bp.route("/messages", methods=["GET"])
def agent_messages():
    msgs = get_all("agent_messages", AGENT_MESSAGES)
    return jsonify({"messages": msgs[-50:]})
