from flask import Blueprint, jsonify, request
from models.data_store import ALERTS, RECOMMENDATIONS
from datetime import datetime
import uuid

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/", methods=["GET"])
def list_alerts():
    active = [a for a in ALERTS if not a["dismissed"]]
    return jsonify({"alerts": active, "total": len(active)})

@alerts_bp.route("/", methods=["POST"])
def create_alert():
    data = request.get_json(force=True) or {}
    alert = {
        "id":        str(uuid.uuid4()),
        "severity":  data.get("severity", "medium"),
        "title":     data.get("title", "New Alert"),
        "message":   data.get("message", ""),
        "zone":      data.get("zone", ""),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "read":      False,
        "dismissed": False,
    }
    ALERTS.insert(0, alert)
    return jsonify(alert), 201

@alerts_bp.route("/<alert_id>/dismiss", methods=["PATCH"])
def dismiss_alert(alert_id: str):
    alert = next((a for a in ALERTS if a["id"] == alert_id), None)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404
    alert["dismissed"] = True
    return jsonify(alert)

@alerts_bp.route("/recommendations", methods=["GET"])
def list_recommendations():
    return jsonify({"recommendations": RECOMMENDATIONS})

@alerts_bp.route("/recommendations/<rec_id>/apply", methods=["POST"])
def apply_recommendation(rec_id: str):
    rec = next((r for r in RECOMMENDATIONS if r["id"] == rec_id), None)
    if not rec:
        return jsonify({"error": "Recommendation not found"}), 404
    rec["applied"] = True
    return jsonify(rec)
