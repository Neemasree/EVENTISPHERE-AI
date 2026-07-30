"""
Orchestrator Agent — coordinates cross-agent workflows.
Runs as a background thread every 30s.
On critical zones it triggers: CrowdAgent → GateAction → AnalyticsSnapshot.
"""
import threading, time, uuid
from models.data_store import ZONES, AGENT_MESSAGES
from datetime import datetime


def _msg(frm, to, message, mtype="info"):
    AGENT_MESSAGES.append({
        "id": str(uuid.uuid4()), "from": frm, "to": to,
        "message": message, "type": mtype,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


def orchestrate():
    while True:
        time.sleep(30)

        # 1. Parking check
        from agents.parking_agent import check_and_alert as parking_check
        parking_check()

        # 2. Scan zones and run agent pipeline per risk level
        from agents import crowd_agent, analytics_agent

        critical_zones = [z for z in ZONES if z["riskLevel"] == "critical"]
        high_zones     = [z for z in ZONES if z["riskLevel"] == "high"]

        if critical_zones:
            # Step 1 — CrowdAgent analyses current state
            crowd_summary = crowd_agent.analyse()
            _msg("orchestrator", "crowd",
                 f"CRITICAL zones detected: {[z['name'] for z in critical_zones]}. "
                 f"Total crowd: {crowd_summary['totalCrowd']}. Redistribute immediately.", "action")

            # Step 2 — Gate action for each critical zone
            for zone in critical_zones:
                _msg("orchestrator", "gate",
                     f"{zone['name']} at {zone['occupancy']}% ({zone['currentCrowd']}/{zone['maxCapacity']}). "
                     f"Open alternate gate and redirect crowd flow.", "action")

            # Step 3 — Analytics snapshot
            snap = analytics_agent.snapshot()
            _msg("orchestrator", "analytics",
                 f"Snapshot recorded post-critical event. "
                 f"Occupancy: {snap['kpi']['occupancyPercent']}%, Risk: {snap['kpi']['riskLevel'].upper()}, "
                 f"Active alerts: {snap['alerts']}.", "info")

        for zone in high_zones:
            if zone["type"] == "gate":
                _msg("orchestrator", "gate",
                     f"{zone['name']} HIGH load ({zone['occupancy']}%). Evaluate alternate gate.", "warning")
            elif zone["type"] == "parking":
                _msg("orchestrator", "parking",
                     f"{zone['name']} HIGH load ({zone['occupancy']}%). Reroute inbound vehicles.", "warning")


def start_orchestrator():
    t = threading.Thread(target=orchestrate, daemon=True)
    t.start()
