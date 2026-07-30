"""
Parking Intelligence Agent — occupancy monitoring, overflow prediction,
arrival-rate tracking, inter-agent comms, and AI-powered ops report.
"""
from models.data_store import ZONES, ALERTS, AGENT_MESSAGES, RECOMMENDATIONS
from datetime import datetime
import uuid, os

# Rolling arrival-rate window (last N ticks)
_arrival_history: list[int] = []
_MAX_HISTORY = 10


def _parking_zones() -> list[dict]:
    return [z for z in ZONES if z["type"] == "parking"]


def _risk(occ: int) -> str:
    if occ >= 95: return "critical"
    if occ >= 80: return "high"
    if occ >= 60: return "medium"
    return "low"


def _overflow_eta(zone: dict, arrival_rate: float) -> int | None:
    """Minutes until zone hits 100%. Returns None if not filling."""
    remaining = zone["maxCapacity"] - zone["currentCrowd"]
    if arrival_rate <= 0 or remaining <= 0:
        return None
    return max(1, round(remaining / arrival_rate))


def _push_agent_msg(from_: str, to: str, message: str, type_: str = "warning"):
    AGENT_MESSAGES.append({
        "id":        str(uuid.uuid4()),
        "from":      from_,
        "to":        to,
        "message":   message,
        "type":      type_,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


def analyse() -> dict:
    """Full parking intelligence snapshot."""
    global _arrival_history

    parking = _parking_zones()
    total_vehicles = sum(z["currentCrowd"] for z in parking)

    # Track arrival rate (delta from last tick)
    _arrival_history.append(total_vehicles)
    if len(_arrival_history) > _MAX_HISTORY:
        _arrival_history.pop(0)

    arrival_rate = 0.0
    if len(_arrival_history) >= 2:
        arrival_rate = max(0.0, (_arrival_history[-1] - _arrival_history[0]) / len(_arrival_history))

    zones_detail = []
    for z in parking:
        eta = _overflow_eta(z, arrival_rate)
        predicted_occ_10min = min(100, round(
            ((z["currentCrowd"] + arrival_rate * 10) / z["maxCapacity"]) * 100
        ))
        zones_detail.append({
            "id":              z["id"],
            "name":            z["name"],
            "currentCrowd":    z["currentCrowd"],
            "maxCapacity":     z["maxCapacity"],
            "occupancy":       z["occupancy"],
            "riskLevel":       _risk(z["occupancy"]),
            "overflowEtaMin":  eta,
            "predicted10min":  predicted_occ_10min,
            "arrivalRate":     round(arrival_rate, 1),
        })

    # Alternate lots with capacity
    available_lots = [z for z in parking if z["occupancy"] < 60]
    full_lots      = [z for z in parking if z["occupancy"] >= 90]
    high_lots      = [z for z in parking if 70 <= z["occupancy"] < 90]

    # Auto inter-agent messaging for critical lots
    for z in full_lots:
        alt = min(available_lots, key=lambda x: x["occupancy"], default=None)
        if alt:
            _push_agent_msg(
                "parking", "orchestrator",
                f"{z['name']} at {z['occupancy']}% — overflow imminent. "
                f"Redirecting arrivals to {alt['name']} ({alt['occupancy']}% load).",
                "warning"
            )
            _push_agent_msg(
                "orchestrator", "crowd",
                f"Parking overflow expected at {z['name']}. "
                f"Expect ~{round(arrival_rate * 5)} pedestrians towards gates in 5 min.",
                "warning"
            )

    # Recommendations
    recs = []
    for z in high_lots + full_lots:
        alt = min(
            [p for p in parking if p["id"] != z["id"] and p["occupancy"] < 60],
            key=lambda x: x["occupancy"], default=None
        )
        if alt:
            recs.append({
                "zone":              z["name"],
                "action":            f"Redirect arrivals from {z['name']} to {alt['name']}",
                "expectedReduction": 35,
                "confidence":        94,
                "deployTimeMin":     2,
            })
        if z["occupancy"] >= 90:
            recs.append({
                "zone":              z["name"],
                "action":            f"Deploy 2 traffic marshals at {z['name']} entrance",
                "expectedReduction": 20,
                "confidence":        88,
                "deployTimeMin":     3,
            })

    # Overall status
    max_occ = max((z["occupancy"] for z in parking), default=0)
    status  = "critical" if max_occ >= 95 else "high" if max_occ >= 80 else "moderate" if max_occ >= 60 else "normal"

    return {
        "status":          status,
        "totalVehicles":   total_vehicles,
        "arrivalRatePerMin": round(arrival_rate, 1),
        "zones":           zones_detail,
        "recommendations": recs[:3],
        "overflowRisk":    len(full_lots) > 0 or len(high_lots) > 0,
        "timestamp":       datetime.utcnow().isoformat() + "Z",
    }


def generate_report() -> dict:
    """AI-powered parking operations report. Falls back to structured offline report."""
    data    = analyse()
    parking = _parking_zones()

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        try:
            import groq, json as _json
            client = groq.Groq(api_key=groq_key)
            prompt = (
                "You are a parking operations AI for a live event. "
                "Generate a concise parking operations report as JSON only (no markdown). "
                f"Live data: {_json.dumps(data)}. "
                "Respond with: {\"overallStatus\": str, \"summary\": str, "
                "\"zones\": [{\"name\", \"occupancy\", \"status\", \"prediction\"}], "
                "\"cause\": str, \"recommendations\": [str x3], "
                "\"expectedImprovement\": str, \"confidence\": int}"
            )
            resp = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3,
            )
            text = resp.choices[0].message.content.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            ai = _json.loads(text)
            return {**ai, "source": "ai", "rawData": data}
        except Exception:
            pass

    # Offline structured report
    zones_summary = []
    for z in parking:
        detail = next((d for d in data["zones"] if d["id"] == z["id"]), {})
        eta    = detail.get("overflowEtaMin")
        pred   = detail.get("predicted10min", z["occupancy"])
        status = _risk(z["occupancy"])
        prediction = (
            f"Will reach capacity in {eta} min" if eta and z["occupancy"] >= 70
            else f"Predicted {pred}% in 10 min"
        )
        zones_summary.append({
            "name":       z["name"],
            "occupancy":  z["occupancy"],
            "crowd":      z["currentCrowd"],
            "capacity":   z["maxCapacity"],
            "status":     status,
            "prediction": prediction,
        })

    high = [z for z in parking if z["occupancy"] >= 80]
    avail = [z for z in parking if z["occupancy"] < 60]
    recs = [r["action"] for r in data["recommendations"]]
    if not recs:
        recs = ["Continue monitoring all parking zones.", "Maintain current traffic flow."]

    cause_parts = []
    if data["arrivalRatePerMin"] > 5:
        cause_parts.append(f"high arrival rate ({data['arrivalRatePerMin']} vehicles/min)")
    if high:
        cause_parts.append(f"{', '.join(z['name'] for z in high)} near capacity")
    cause = "Elevated occupancy due to " + " and ".join(cause_parts) if cause_parts else "Normal operations"

    improvement = f"Occupancy reduced by ~35% in {avail[0]['name']}" if avail else "Deploy overflow measures"

    return {
        "overallStatus":       data["status"],
        "summary":             (
            f"Parking at {data['status'].upper()} utilization. "
            f"{data['totalVehicles']} vehicles across {len(parking)} lots. "
            f"Arrival rate: {data['arrivalRatePerMin']} vehicles/min."
        ),
        "zones":               zones_summary,
        "cause":               cause,
        "recommendations":     recs,
        "expectedImprovement": improvement,
        "confidence":          94 if high else 80,
        "source":              "offline",
        "rawData":             data,
    }


def reroute(from_lot: str, to_lot: str) -> dict:
    src  = next((z for z in ZONES if z["id"] == from_lot), None)
    dest = next((z for z in ZONES if z["id"] == to_lot),   None)
    if not src or not dest:
        return {"error": "Lot not found"}
    _push_agent_msg(
        "parking", "orchestrator",
        f"Rerouting vehicles from {src['name']} ({src['occupancy']}%) to {dest['name']} ({dest['occupancy']}%).",
        "action"
    )
    return {"status": "rerouting", "from": src["name"], "to": dest["name"]}


def check_and_alert():
    for zone in _parking_zones():
        if zone["occupancy"] >= 85:
            existing = [a for a in ALERTS if not a["dismissed"] and zone["name"] in a.get("zone", "")]
            if not existing:
                ALERTS.insert(0, {
                    "id":        str(uuid.uuid4()),
                    "severity":  "critical" if zone["occupancy"] >= 95 else "high",
                    "title":     f"{zone['name']} Near Capacity",
                    "message":   f"{zone['name']} at {zone['occupancy']}%. Recommend rerouting to alternate lot.",
                    "zone":      zone["name"],
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "read":      False,
                    "dismissed": False,
                })
