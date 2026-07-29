from flask import Blueprint, jsonify, request
from models.data_store import get_all, get_one, insert_one, update_one, ALERTS, RECOMMENDATIONS
from datetime import datetime
import uuid

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/", methods=["GET"])
def list_alerts():
    all_alerts = get_all("alerts", ALERTS)
    active = [a for a in all_alerts if not a.get("dismissed")]
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
    insert_one("alerts", ALERTS, alert, prepend=True)
    return jsonify(alert), 201

@alerts_bp.route("/<alert_id>/dismiss", methods=["PATCH"])
def dismiss_alert(alert_id: str):
    alert = get_one("alerts", ALERTS, "id", alert_id)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404
    update_one("alerts", ALERTS, "id", alert_id, {"dismissed": True})
    alert["dismissed"] = True
    return jsonify(alert)

@alerts_bp.route("/recommendations", methods=["GET"])
def list_recommendations():
    recs = get_all("recommendations", RECOMMENDATIONS)
    return jsonify({"recommendations": recs})

@alerts_bp.route("/recommendations/<rec_id>/apply", methods=["POST"])
def apply_recommendation(rec_id: str):
    rec = get_one("recommendations", RECOMMENDATIONS, "id", rec_id)
    if not rec:
        return jsonify({"error": "Recommendation not found"}), 404
    update_one("recommendations", RECOMMENDATIONS, "id", rec_id, {"applied": True})
    rec["applied"] = True
    return jsonify(rec)
