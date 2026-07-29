from flask import Blueprint, jsonify, request
from models.data_store import ZONES, ALERTS, SIMULATION_LOGS, AGENT_MESSAGES, EVENT_LOGS
from datetime import datetime
import uuid, random

simulator_bp = Blueprint("simulator", __name__)

def _risk(occ: int) -> str:
    if occ >= 95: return "critical"
    if occ >= 80: return "high"
    if occ >= 60: return "medium"
    return "low"

def _add_log(scenario: str, description: str):
    SIMULATION_LOGS.append({
        "id": str(uuid.uuid4()), "scenario": scenario,
        "description": description,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })

def _add_msg(frm: str, to: str, message: str, mtype: str = "action"):
    AGENT_MESSAGES.append({
        "id": str(uuid.uuid4()), "from": frm, "to": to,
        "message": message, "type": mtype,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })

def _add_event(title: str, description: str, etype: str, agent: str = "orchestrator"):
    EVENT_LOGS.append({
        "id": str(uuid.uuid4()), "title": title,
        "description": description, "type": etype, "agent": agent,
        "time": datetime.utcnow().isoformat() + "Z",
    })

SCENARIO_HANDLERS = {
    "add_50": lambda: _add_visitors(50),
    "add_100": lambda: _add_visitors(100),
    "add_500": lambda: _add_visitors(500),
    "bus_arrives": lambda: _bus_arrives(),
    "rain_starts": lambda: _rain_starts(),
    "vip_arrival": lambda: _vip_arrival(),
    "concert_starts": lambda: _concert_starts(),
    "emergency": lambda: _emergency(),
    "power_failure": lambda: _power_failure(),
    "event_ends": lambda: _event_ends(),
}

def _add_visitors(count: int):
    per_zone = count // len(ZONES)
    for z in ZONES:
        z["currentCrowd"] = min(z["maxCapacity"], z["currentCrowd"] + per_zone)
        z["occupancy"] = round(z["currentCrowd"] / z["maxCapacity"] * 100)
        z["riskLevel"] = _risk(z["occupancy"])
    _add_log(f"add_{count}", f"{count} visitors added across all zones.")
    _add_event(f"+{count} Visitors", f"{count} visitors entered the venue.", "warning", "crowd")

def _bus_arrives():
    gate = next((z for z in ZONES if z["id"] == "gate_a"), None)
    if gate:
        gate["currentCrowd"] = min(gate["maxCapacity"], gate["currentCrowd"] + 180)
        gate["occupancy"] = round(gate["currentCrowd"] / gate["maxCapacity"] * 100)
        gate["riskLevel"] = _risk(gate["occupancy"])
    ALERTS.insert(0, {"id": str(uuid.uuid4()), "severity": "high",
        "title": "Bus Arrived at Gate A", "message": "Coach bus dropped 180 passengers at Gate A.",
        "zone": "Gate A", "timestamp": datetime.utcnow().isoformat()+"Z", "read": False, "dismissed": False})
    _add_msg("crowd", "orchestrator", "Bus arrival: Gate A +180 visitors.", "warning")
    _add_msg("orchestrator", "gate", "Open Gate B and C to absorb bus arrival.", "action")
    _add_event("Bus Arrived", "180 passengers arriving at Gate A.", "warning", "crowd")

def _rain_starts():
    for zid in ["food_court", "restrooms"]:
        z = next((z for z in ZONES if z["id"] == zid), None)
        if z:
            z["currentCrowd"] = min(z["maxCapacity"], z["currentCrowd"] + 80)
            z["occupancy"] = round(z["currentCrowd"] / z["maxCapacity"] * 100)
            z["riskLevel"] = _risk(z["occupancy"])
    _add_msg("crowd", "orchestrator", "Rain alert: visitors seeking shelter. Indoor zones surging.", "warning")
    _add_event("Rain Started", "Visitors moving to covered areas. Indoor zones filling.", "warning", "crowd")

def _vip_arrival():
    vip = next((z for z in ZONES if z["id"] == "vip"), None)
    if vip:
        vip["currentCrowd"] = min(vip["maxCapacity"], vip["currentCrowd"] + 30)
        vip["occupancy"] = round(vip["currentCrowd"] / vip["maxCapacity"] * 100)
    _add_msg("ticket", "orchestrator", "VIP arrival confirmed. Fast-track lane cleared.", "action")
    _add_event("VIP Arrival", "VIP entourage arrived. Fast-track lane activated.", "action", "ticket")

def _concert_starts():
    stage = next((z for z in ZONES if z["id"] == "main_stage"), None)
    if stage:
        stage["currentCrowd"] = min(stage["maxCapacity"], stage["currentCrowd"] + 800)
        stage["occupancy"] = round(stage["currentCrowd"] / stage["maxCapacity"] * 100)
        stage["riskLevel"] = _risk(stage["occupancy"])
    _add_msg("crowd", "orchestrator", "Concert start: Main Stage crowd surging.", "warning")
    _add_msg("orchestrator", "emergency", "Stage surge detected. Deploy crowd safety team.", "action")
    _add_event("Concert Started", "Main act started. Crowd surging toward Main Stage.", "warning", "crowd")

def _emergency():
    ALERTS.insert(0, {"id": str(uuid.uuid4()), "severity": "critical",
        "title": "EMERGENCY: Medical Incident",
        "message": "Medical emergency reported near Main Stage. Emergency team dispatched.",
        "zone": "Main Stage", "timestamp": datetime.utcnow().isoformat()+"Z", "read": False, "dismissed": False})
    _add_msg("emergency", "orchestrator", "CRITICAL: Medical emergency. Dispatching Team 1.", "action")
    _add_msg("orchestrator", "crowd", "Clear path to Main Stage for emergency team.", "action")
    _add_msg("orchestrator", "parking", "Reserve emergency lane at main entrance.", "action")
    _add_event("EMERGENCY", "Medical emergency near Main Stage.", "critical", "emergency")

def _power_failure():
    ALERTS.insert(0, {"id": str(uuid.uuid4()), "severity": "critical",
        "title": "Power Failure",
        "message": "Partial power failure in Food Court sector. Emergency lighting active.",
        "zone": "Food Court", "timestamp": datetime.utcnow().isoformat()+"Z", "read": False, "dismissed": False})
    _add_msg("emergency", "orchestrator", "Power failure in sector 3. Emergency lighting deployed.", "warning")
    _add_msg("orchestrator", "crowd", "Initiate safe evacuation of Food Court sector.", "action")
    _add_event("Power Failure", "Partial power failure in Food Court.", "critical", "emergency")

def _event_ends():
    for zid in ["exit_main", "emergency_exit"]:
        z = next((z for z in ZONES if z["id"] == zid), None)
        if z:
            z["currentCrowd"] = min(z["maxCapacity"], z["currentCrowd"] + 400)
            z["occupancy"] = round(z["currentCrowd"] / z["maxCapacity"] * 100)
    _add_msg("orchestrator", "gate", "Event ended. Open all exit gates.", "action")
    _add_msg("orchestrator", "parking", "Prepare vehicle dispatch. Crowd exiting.", "action")
    _add_msg("crowd", "orchestrator", "Exit crowd prediction: 4,000 in next 20 min.", "warning")
    _add_event("Event Ended", "Main performance concluded. Crowd moving to exits.", "warning", "orchestrator")


@simulator_bp.route("/trigger", methods=["POST"])
def trigger_scenario():
    data = request.get_json(force=True) or {}
    scenario = data.get("scenario", "")
    if scenario not in SCENARIO_HANDLERS:
        return jsonify({"error": f"Unknown scenario: {scenario}",
                        "valid": list(SCENARIO_HANDLERS.keys())}), 400
    SCENARIO_HANDLERS[scenario]()
    return jsonify({"status": "triggered", "scenario": scenario,
                    "timestamp": datetime.utcnow().isoformat() + "Z"})

@simulator_bp.route("/logs", methods=["GET"])
def sim_logs():
    return jsonify({"logs": SIMULATION_LOGS[-50:]})
