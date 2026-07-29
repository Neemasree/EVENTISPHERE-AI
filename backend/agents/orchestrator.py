"""
Orchestrator Agent — coordinates cross-agent workflows.
Runs as a background thread when the Flask app starts (optional).
"""
import threading, time
from models.data_store import ZONES, ALERTS, AGENT_MESSAGES, EVENT_LOGS
from datetime import datetime
import uuid

def _msg(frm, to, message, mtype="info"):
    AGENT_MESSAGES.append({
        "id": str(uuid.uuid4()), "from": frm, "to": to,
        "message": message, "type": mtype,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })

def orchestrate():
    """Check state every 30 seconds and coordinate agents."""
    while True:
        time.sleep(30)
        for zone in ZONES:
            if zone["riskLevel"] == "critical":
                _msg("orchestrator", "crowd",
                     f"{zone['name']} CRITICAL ({zone['occupancy']}%). Redistribute crowd.", "action")
                _msg("orchestrator", "analytics",
                     f"Log critical event for {zone['name']}.", "info")
            elif zone["riskLevel"] == "high" and zone["type"] == "gate":
                _msg("orchestrator", "gate",
                     f"{zone['name']} HIGH load. Evaluate alternate gate.", "warning")
            elif zone["riskLevel"] == "high" and zone["type"] == "parking":
                _msg("orchestrator", "parking",
                     f"{zone['name']} HIGH load. Reroute inbound vehicles.", "warning")

def start_orchestrator():
    t = threading.Thread(target=orchestrate, daemon=True)
    t.start()
