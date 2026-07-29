from flask import Blueprint, jsonify, request
from models.data_store import ZONES, tick_zones
from utils.ai_engine import generate_prediction

zones_bp = Blueprint("zones", __name__)

@zones_bp.route("/", methods=["GET"])
def list_zones():
    tick_zones()
    return jsonify({"zones": ZONES})

@zones_bp.route("/<zone_id>", methods=["GET"])
def zone_detail(zone_id: str):
    zone = next((z for z in ZONES if z["id"] == zone_id), None)
    if not zone:
        return jsonify({"error": "Zone not found"}), 404
    prediction = generate_prediction(zone_id)
    return jsonify({"zone": zone, "prediction": prediction})

@zones_bp.route("/<zone_id>/update", methods=["PATCH"])
def update_zone(zone_id: str):
    zone = next((z for z in ZONES if z["id"] == zone_id), None)
    if not zone:
        return jsonify({"error": "Zone not found"}), 404
    data = request.get_json(force=True) or {}
    for key in ("currentCrowd", "waitingTime", "riskLevel"):
        if key in data:
            zone[key] = data[key]
    if "currentCrowd" in data:
        zone["occupancy"] = round(data["currentCrowd"] / zone["maxCapacity"] * 100)
    return jsonify({"zone": zone})
