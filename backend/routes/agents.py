from flask import Blueprint, jsonify, request
from models.data_store import AGENTS, AGENT_MESSAGES
from utils.ai_engine import run_decision_engine
from datetime import datetime
import uuid

agents_bp = Blueprint("agents", __name__)

@agents_bp.route("/status", methods=["GET"])
def agents_status():
    return jsonify({"agents": AGENTS})

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
    AGENT_MESSAGES.append(msg)
    return jsonify(msg), 201

@agents_bp.route("/messages", methods=["GET"])
def agent_messages():
    return jsonify({"messages": AGENT_MESSAGES[-50:]})
