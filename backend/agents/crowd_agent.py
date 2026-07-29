"""Crowd Intelligence Agent — monitors density, predicts congestion."""
from models.data_store import ZONES, ALERTS, PREDICTIONS
from datetime import datetime
import uuid

def analyse() -> dict:
    critical = [z for z in ZONES if z["riskLevel"] == "critical"]
    high     = [z for z in ZONES if z["riskLevel"] == "high"]
    return {
        "criticalZones": [z["name"] for z in critical],
        "highRiskZones": [z["name"] for z in high],
        "totalCrowd":    sum(z["currentCrowd"] for z in ZONES),
        "predictions":   PREDICTIONS,
        "timestamp":     datetime.utcnow().isoformat() + "Z",
    }

def predict(zone_id: str) -> dict | None:
    zone = next((z for z in ZONES if z["id"] == zone_id), None)
    if not zone: return None
    base = zone["currentCrowd"]
    return {
        "zoneId":  zone_id, "zoneName": zone["name"],
        "current": base,
        "in5min":  min(zone["maxCapacity"], int(base * 1.12)),
        "in10min": min(zone["maxCapacity"], int(base * 1.25)),
        "in30min": min(zone["maxCapacity"], int(base * 1.10)),
        "capacity": zone["maxCapacity"],
        "confidence": 91,
    }
