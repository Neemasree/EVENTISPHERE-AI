from flask import Blueprint, jsonify
from models.data_store import ZONES, EVENT_LOGS, SIMULATION_LOGS
from agents import analytics_agent
from datetime import datetime

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/kpi", methods=["GET"])
def kpi():
    snap = analytics_agent.snapshot()   # records snapshot + posts agent message
    return jsonify(snap["kpi"])

@analytics_bp.route("/hourly", methods=["GET"])
def hourly():
    insights = analytics_agent.get_insights()
    kpi_data = insights["kpi"]
    # Build a live 8-hour ramp from current crowd
    total = kpi_data.get("currentCrowd", 8000)
    cap   = kpi_data.get("totalCapacity", 15000)
    from datetime import datetime as _dt
    now = _dt.utcnow()
    data = []
    for h in range(-7, 1):
        frac = (h + 8) / 8
        data.append({
            "hour":      (_dt(now.year, now.month, now.day, now.hour) .__class__(now.year, now.month, now.day, (now.hour + h) % 24)).strftime("%H:00"),
            "visitors":  int(total * frac * (0.75 + 0.25 * frac)),
            "capacity":  cap,
            "incidents": 0,
        })
    return jsonify({"data": data})

@analytics_bp.route("/zones", methods=["GET"])
def zone_analytics():
    snap = analytics_agent.snapshot()
    data = [
        {"zone": z["name"], "avgOccupancy": z["occupancy"],
         "peakCrowd": z["occupancy"], "avgWait": z["risk"]}
        for z in snap["zones"]
    ]
    return jsonify({"zones": data})

@analytics_bp.route("/report", methods=["GET"])
def report():
    return jsonify(analytics_agent.generate_report())
