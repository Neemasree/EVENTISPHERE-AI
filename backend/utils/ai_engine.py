"""
AI Logic: occupancy calculation, risk detection, prediction engine,
recommendation engine, alert generation, decision engine.
"""
from models.data_store import ZONES, PREDICTIONS, RECOMMENDATIONS
from datetime import datetime

def compute_kpi() -> dict:
    total_crowd = sum(z["currentCrowd"] for z in ZONES)
    total_cap   = sum(z["maxCapacity"]  for z in ZONES)
    occupancy   = round(total_crowd / total_cap * 100) if total_cap else 0
    avg_wait    = round(sum(z["waitingTime"] for z in ZONES) / len(ZONES))
    peak_zone   = max(ZONES, key=lambda z: z["occupancy"])["name"]
    critical    = sum(1 for z in ZONES if z["riskLevel"] == "critical")
    high        = sum(1 for z in ZONES if z["riskLevel"] == "high")
    risk        = "critical" if critical > 0 else "high" if high > 1 else "medium" if high > 0 else "low"
    return {
        "currentCrowd":    total_crowd,
        "totalCapacity":   total_cap,
        "occupancyPercent": occupancy,
        "avgWaitTime":     avg_wait,
        "peakZone":        peak_zone,
        "riskLevel":       risk,
        "flowRate":        240,
        "timestamp":       datetime.utcnow().isoformat() + "Z",
    }

def generate_prediction(zone_id: str) -> dict | None:
    return next((p for p in PREDICTIONS if p["zoneId"] == zone_id), None)

def run_decision_engine() -> list[dict]:
    """
    Orchestrator-level: cross-agent decisions based on current state.
    Returns list of action directives.
    """
    decisions = []
    for zone in ZONES:
        if zone["riskLevel"] == "critical":
            decisions.append({
                "agent":   "orchestrator",
                "target":  "crowd",
                "action":  f"CRITICAL: {zone['name']} at {zone['occupancy']}%. Redistribute crowd immediately.",
                "priority": 1,
            })
        elif zone["riskLevel"] == "high" and zone["type"] == "gate":
            decisions.append({
                "agent":   "orchestrator",
                "target":  "gate",
                "action":  f"HIGH: {zone['name']} queue building. Evaluate alternate gate.",
                "priority": 2,
            })
        elif zone["riskLevel"] == "high" and zone["type"] == "parking":
            decisions.append({
                "agent":   "orchestrator",
                "target":  "parking",
                "action":  f"HIGH: {zone['name']} near full. Reroute vehicles.",
                "priority": 2,
            })
    return decisions

def analyse_crowd(zone_data: list[dict]) -> dict:
    """Accept POST body with zone data and return analysis."""
    total      = sum(z.get("currentCrowd", 0) for z in zone_data)
    total_cap  = sum(z.get("maxCapacity", 1)   for z in zone_data)
    occ        = round(total / total_cap * 100) if total_cap else 0
    high_risk  = [z["name"] for z in zone_data if z.get("occupancy", 0) >= 80]
    return {
        "totalCrowd":    total,
        "occupancy":     occ,
        "highRiskZones": high_risk,
        "recommendation": f"Reduce load in {high_risk[0]}" if high_risk else "All zones stable",
    }
