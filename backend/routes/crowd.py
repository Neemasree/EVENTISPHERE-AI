from flask import Blueprint, jsonify, request
from models.data_store import ZONES, tick_zones, EVENT_LOGS
from utils.ai_engine import compute_kpi, analyse_crowd
from agents import crowd_agent
from datetime import datetime

crowd_bp = Blueprint("crowd", __name__)

@crowd_bp.route("/status", methods=["GET"])
def crowd_status():
    tick_zones()
    summary = crowd_agent.analyse()   # agent enriches with criticalZones + predictions
    return jsonify({"zones": ZONES, "kpi": compute_kpi(), "agentSummary": summary})

@crowd_bp.route("/analyse", methods=["POST"])
def crowd_analyse():
    data  = request.get_json(force=True) or {}
    zones = data.get("zones", ZONES)
    base  = analyse_crowd(zones)
    base["agentSummary"] = crowd_agent.analyse()   # agent layer on top
    return jsonify(base)

@crowd_bp.route("/history", methods=["GET"])
def crowd_history():
    return jsonify({"events": EVENT_LOGS})

@crowd_bp.route("/predictions", methods=["GET"])
def crowd_predictions():
    from models.data_store import PREDICTIONS
    return jsonify({"predictions": PREDICTIONS})

@crowd_bp.route("/zones", methods=["GET"])
def crowd_zones():
    tick_zones()
    return jsonify({"zones": ZONES})
