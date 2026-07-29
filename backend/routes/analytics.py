from flask import Blueprint, jsonify
from models.data_store import ZONES, EVENT_LOGS, SIMULATION_LOGS
from utils.ai_engine import compute_kpi
from datetime import datetime

analytics_bp = Blueprint("analytics", __name__)

_HOURLY = [
    {"hour": "14:00", "visitors": 1200, "capacity": 8000, "incidents": 0},
    {"hour": "15:00", "visitors": 3400, "capacity": 8000, "incidents": 1},
    {"hour": "16:00", "visitors": 5800, "capacity": 8000, "incidents": 2},
    {"hour": "17:00", "visitors": 7200, "capacity": 8000, "incidents": 1},
    {"hour": "18:00", "visitors": 8100, "capacity": 8000, "incidents": 3},
    {"hour": "19:00", "visitors": 7600, "capacity": 8000, "incidents": 2},
    {"hour": "20:00", "visitors": 6200, "capacity": 8000, "incidents": 1},
    {"hour": "21:00", "visitors": 4800, "capacity": 8000, "incidents": 0},
]

@analytics_bp.route("/kpi", methods=["GET"])
def kpi():
    return jsonify(compute_kpi())

@analytics_bp.route("/hourly", methods=["GET"])
def hourly():
    return jsonify({"data": _HOURLY})

@analytics_bp.route("/zones", methods=["GET"])
def zone_analytics():
    data = [
        {
            "zone":        z["name"],
            "avgOccupancy": z["occupancy"],
            "peakCrowd":   z["currentCrowd"],
            "avgWait":     z["waitingTime"],
        }
        for z in ZONES
    ]
    return jsonify({"zones": data})

@analytics_bp.route("/report", methods=["GET"])
def report():
    kpi_data = compute_kpi()
    return jsonify({
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "kpi":          kpi_data,
        "zoneCount":    len(ZONES),
        "eventLogs":    len(EVENT_LOGS),
        "simLogs":      len(SIMULATION_LOGS),
        "summary":      "Event running smoothly. Food Court requires immediate attention.",
    })
