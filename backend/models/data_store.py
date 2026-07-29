"""
In-memory data store that simulates MongoDB collections.
Swap each dict/list for actual PyMongo collection calls when a real DB is connected.
Collections mirrored: crowd_status, zones, alerts, recommendations, predictions,
                       notifications, agent_messages, simulation_logs, event_logs
"""
import time, random
from datetime import datetime, timedelta

def _ts(offset_min: int = 0) -> str:
    return (datetime.utcnow() - timedelta(minutes=offset_min)).isoformat() + "Z"

# ── zones ──────────────────────────────────────────────────────────────────
ZONES: list[dict] = [
    {"id": "parking_a",    "name": "Parking A",      "type": "parking",       "currentCrowd": 420, "maxCapacity": 500, "occupancy": 84,  "waitingTime": 5,  "riskLevel": "high"},
    {"id": "parking_b",    "name": "Parking B",      "type": "parking",       "currentCrowd": 180, "maxCapacity": 500, "occupancy": 36,  "waitingTime": 1,  "riskLevel": "low"},
    {"id": "gate_a",       "name": "Gate A",          "type": "gate",          "currentCrowd": 380, "maxCapacity": 500, "occupancy": 76,  "waitingTime": 8,  "riskLevel": "high"},
    {"id": "gate_b",       "name": "Gate B",          "type": "gate",          "currentCrowd": 120, "maxCapacity": 500, "occupancy": 24,  "waitingTime": 2,  "riskLevel": "low"},
    {"id": "gate_c",       "name": "Gate C",          "type": "gate",          "currentCrowd": 90,  "maxCapacity": 500, "occupancy": 18,  "waitingTime": 1,  "riskLevel": "low"},
    {"id": "vip",          "name": "VIP Lounge",      "type": "vip",           "currentCrowd": 45,  "maxCapacity": 150, "occupancy": 30,  "waitingTime": 0,  "riskLevel": "low"},
    {"id": "main_stage",   "name": "Main Stage",      "type": "stage",         "currentCrowd": 3200,"maxCapacity": 5000,"occupancy": 64,  "waitingTime": 0,  "riskLevel": "medium"},
    {"id": "food_court",   "name": "Food Court",      "type": "food",          "currentCrowd": 520, "maxCapacity": 600, "occupancy": 87,  "waitingTime": 12, "riskLevel": "critical"},
    {"id": "medical",      "name": "Medical Bay",     "type": "medical",       "currentCrowd": 8,   "maxCapacity": 50,  "occupancy": 16,  "waitingTime": 3,  "riskLevel": "low"},
    {"id": "restrooms",    "name": "Restrooms",       "type": "restroom",      "currentCrowd": 95,  "maxCapacity": 120, "occupancy": 79,  "waitingTime": 6,  "riskLevel": "high"},
    {"id": "exit_main",    "name": "Main Exit",       "type": "exit",          "currentCrowd": 140, "maxCapacity": 400, "occupancy": 35,  "waitingTime": 2,  "riskLevel": "low"},
    {"id": "emergency_exit","name":"Emergency Exit",  "type": "emergency_exit","currentCrowd": 0,   "maxCapacity": 1000,"occupancy": 0,   "waitingTime": 0,  "riskLevel": "low"},
]

# ── alerts ─────────────────────────────────────────────────────────────────
ALERTS: list[dict] = [
    {"id": "a1", "severity": "critical", "title": "Food Court Overflow Imminent", "message": "Food Court at 87% capacity.", "zone": "Food Court", "timestamp": _ts(2),  "read": False, "dismissed": False},
    {"id": "a2", "severity": "high",     "title": "Gate A Queue Building",        "message": "Gate A queue: 380 people.",  "zone": "Gate A",     "timestamp": _ts(8),  "read": False, "dismissed": False},
    {"id": "a3", "severity": "high",     "title": "Parking A Near Full",          "message": "Parking A at 84%.",          "zone": "Parking A",  "timestamp": _ts(15), "read": True,  "dismissed": False},
]

# ── recommendations ────────────────────────────────────────────────────────
RECOMMENDATIONS: list[dict] = [
    {"id": "r1", "title": "Open Food Stall 3",      "zone": "Food Court", "expectedReduction": 28, "estimatedTime": 3,  "confidence": 97, "applied": False, "timestamp": _ts(2)},
    {"id": "r2", "title": "Reroute Parking to Lot B","zone": "Parking A", "expectedReduction": 35, "estimatedTime": 2,  "confidence": 94, "applied": False, "timestamp": _ts(5)},
    {"id": "r3", "title": "Open Gate C",             "zone": "Gate A",    "expectedReduction": 31, "estimatedTime": 2,  "confidence": 96, "applied": True,  "timestamp": _ts(25)},
]

# ── predictions ────────────────────────────────────────────────────────────
PREDICTIONS: list[dict] = [
    {"zoneId": "gate_a",     "zoneName": "Gate A",     "current": 380, "in5min": 430, "in10min": 510, "in30min": 480, "predictedRisk": "critical", "confidence": 94, "capacity": 500},
    {"zoneId": "food_court", "zoneName": "Food Court", "current": 520, "in5min": 580, "in10min": 600, "in30min": 550, "predictedRisk": "critical", "confidence": 97, "capacity": 600},
    {"zoneId": "parking_a",  "zoneName": "Parking A",  "current": 420, "in5min": 460, "in10min": 490, "in30min": 500, "predictedRisk": "high",     "confidence": 89, "capacity": 500},
]

# ── agent messages ─────────────────────────────────────────────────────────
AGENT_MESSAGES: list[dict] = []

# ── simulation logs ────────────────────────────────────────────────────────
SIMULATION_LOGS: list[dict] = []

# ── event logs ─────────────────────────────────────────────────────────────
EVENT_LOGS: list[dict] = [
    {"id": "e1", "time": _ts(45), "title": "Event Started",    "type": "normal",   "agent": "orchestrator"},
    {"id": "e2", "time": _ts(32), "title": "Parking A Surge",  "type": "warning",  "agent": "parking"},
    {"id": "e3", "time": _ts(25), "title": "Gate C Opened",    "type": "action",   "agent": "gate"},
    {"id": "e4", "time": _ts(8),  "title": "Food Court Alert", "type": "critical", "agent": "crowd"},
]

# ── agents ─────────────────────────────────────────────────────────────────
AGENTS: list[dict] = [
    {"id": "orchestrator", "name": "Orchestrator",    "status": "active",     "messagesProcessed": 284},
    {"id": "crowd",        "name": "Crowd Agent",     "status": "alert",      "messagesProcessed": 512},
    {"id": "parking",      "name": "Parking Agent",   "status": "processing", "messagesProcessed": 198},
    {"id": "gate",         "name": "Gate Agent",      "status": "active",     "messagesProcessed": 341},
    {"id": "ticket",       "name": "Ticket Agent",    "status": "active",     "messagesProcessed": 14834},
    {"id": "emergency",    "name": "Emergency Agent", "status": "idle",       "messagesProcessed": 47},
    {"id": "analytics",    "name": "Analytics Agent", "status": "active",     "messagesProcessed": 891},
]

def _risk(occ: int) -> str:
    if occ >= 95: return "critical"
    if occ >= 80: return "high"
    if occ >= 60: return "medium"
    return "low"

def tick_zones():
    """Simulate live data changes."""
    for z in ZONES:
        delta = random.randint(-8, 10)
        z["currentCrowd"] = max(0, min(z["maxCapacity"], z["currentCrowd"] + delta))
        z["occupancy"]    = round(z["currentCrowd"] / z["maxCapacity"] * 100)
        z["riskLevel"]    = _risk(z["occupancy"])
