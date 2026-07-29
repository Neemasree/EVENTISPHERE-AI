from flask import Blueprint, jsonify, request
from models.data_store import get_all, get_one, update_one, tick_zones, ZONES, PREDICTIONS
from utils.ai_engine import generate_prediction

zones_bp = Blueprint("zones", __name__)

@zones_bp.route("/", methods=["GET"])
def list_zones():
    zones = tick_zones()
    return jsonify({"zones": zones})

@zones_bp.route("/<zone_id>", methods=["GET"])
def zone_detail(zone_id: str):
    zone = get_one("zones", ZONES, "id", zone_id)
    if not zone:
        return jsonify({"error": "Zone not found"}), 404
    prediction = generate_prediction(zone_id)
    return jsonify({"zone": zone, "prediction": prediction})

@zones_bp.route("/<zone_id>/update", methods=["PATCH"])
def update_zone(zone_id: str):
    zone = get_one("zones", ZONES, "id", zone_id)
    if not zone:
        return jsonify({"error": "Zone not found"}), 404
    data = request.get_json(force=True) or {}
    updates = {}
    for key in ("currentCrowd", "waitingTime", "riskLevel"):
        if key in data:
            updates[key] = data[key]
    if "currentCrowd" in data:
        updates["occupancy"] = round(data["currentCrowd"] / zone["maxCapacity"] * 100)
    update_one("zones", ZONES, "id", zone_id, updates)
    zone.update(updates)
    return jsonify({"zone": zone})
