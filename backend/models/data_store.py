"""
MongoDB-backed data store for EventiSphere AI.
Falls back to in-memory if MONGO_URI is not set or connection fails.
"""
import os, random
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

# ── globals ──────────────────────────────────────────────────────────────────
_client   = None
_db       = None
USE_MONGO = False

# ── helpers ──────────────────────────────────────────────────────────────────
def _ts(offset_min: int = 0) -> str:
    return (datetime.utcnow() - timedelta(minutes=offset_min)).isoformat() + "Z"

def _risk(occ: int) -> str:
    if occ >= 95: return "critical"
    if occ >= 80: return "high"
    if occ >= 60: return "medium"
    return "low"

# ── seed data ────────────────────────────────────────────────────────────────
_SEED_ZONES = [
    {"id": "parking_a",      "name": "Parking A",      "type": "parking",       "currentCrowd": 420, "maxCapacity": 500,  "occupancy": 84, "waitingTime": 5,  "riskLevel": "high",     "x": 20,  "y": 20,  "width": 130, "height": 60},
    {"id": "parking_b",      "name": "Parking B",      "type": "parking",       "currentCrowd": 180, "maxCapacity": 500,  "occupancy": 36, "waitingTime": 1,  "riskLevel": "low",      "x": 170, "y": 20,  "width": 130, "height": 60},
    {"id": "vip",            "name": "VIP Lounge",     "type": "vip",           "currentCrowd": 45,  "maxCapacity": 150,  "occupancy": 30, "waitingTime": 0,  "riskLevel": "low",      "x": 320, "y": 20,  "width": 110, "height": 60},
    {"id": "emergency_exit", "name": "Emergency Exit", "type": "emergency_exit","currentCrowd": 0,   "maxCapacity": 1000, "occupancy": 0,  "waitingTime": 0,  "riskLevel": "low",      "x": 450, "y": 20,  "width": 70,  "height": 60},
    {"id": "gate_a",         "name": "Gate A",         "type": "gate",          "currentCrowd": 380, "maxCapacity": 500,  "occupancy": 76, "waitingTime": 8,  "riskLevel": "high",     "x": 20,  "y": 100, "width": 90,  "height": 55},
    {"id": "gate_b",         "name": "Gate B",         "type": "gate",          "currentCrowd": 120, "maxCapacity": 500,  "occupancy": 24, "waitingTime": 2,  "riskLevel": "low",      "x": 125, "y": 100, "width": 90,  "height": 55},
    {"id": "gate_c",         "name": "Gate C",         "type": "gate",          "currentCrowd": 90,  "maxCapacity": 500,  "occupancy": 18, "waitingTime": 1,  "riskLevel": "low",      "x": 230, "y": 100, "width": 90,  "height": 55},
    {"id": "food_court",     "name": "Food Court",     "type": "food",          "currentCrowd": 520, "maxCapacity": 600,  "occupancy": 87, "waitingTime": 12, "riskLevel": "critical", "x": 340, "y": 100, "width": 180, "height": 55},
    {"id": "main_stage",     "name": "Main Stage",     "type": "stage",         "currentCrowd": 3200,"maxCapacity": 5000, "occupancy": 64, "waitingTime": 0,  "riskLevel": "medium",   "x": 20,  "y": 175, "width": 300, "height": 120},
    {"id": "medical",        "name": "Medical Bay",    "type": "medical",       "currentCrowd": 8,   "maxCapacity": 50,   "occupancy": 16, "waitingTime": 3,  "riskLevel": "low",      "x": 340, "y": 175, "width": 90,  "height": 55},
    {"id": "restrooms",      "name": "Restrooms",      "type": "restroom",      "currentCrowd": 95,  "maxCapacity": 120,  "occupancy": 79, "waitingTime": 6,  "riskLevel": "high",     "x": 450, "y": 175, "width": 70,  "height": 55},
    {"id": "exit_main",      "name": "Main Exit",      "type": "exit",          "currentCrowd": 140, "maxCapacity": 400,  "occupancy": 35, "waitingTime": 2,  "riskLevel": "low",      "x": 340, "y": 250, "width": 180, "height": 50},
]

_SEED_ALERTS = [
    {"id": "a1", "severity": "critical", "title": "Food Court Overflow Imminent", "message": "Food Court at 87% capacity.", "zone": "Food Court", "timestamp": _ts(2),  "read": False, "dismissed": False},
    {"id": "a2", "severity": "high",     "title": "Gate A Queue Building",        "message": "Gate A queue: 380 people.",  "zone": "Gate A",     "timestamp": _ts(8),  "read": False, "dismissed": False},
    {"id": "a3", "severity": "high",     "title": "Parking A Near Full",          "message": "Parking A at 84%.",          "zone": "Parking A",  "timestamp": _ts(15), "read": True,  "dismissed": False},
]

_SEED_RECS = [
    {"id": "r1", "title": "Open Food Stall 3",        "zone": "Food Court", "expectedReduction": 28, "estimatedTime": 3, "confidence": 97, "applied": False, "timestamp": _ts(2)},
    {"id": "r2", "title": "Reroute Parking to Lot B", "zone": "Parking A",  "expectedReduction": 35, "estimatedTime": 2, "confidence": 94, "applied": False, "timestamp": _ts(5)},
    {"id": "r3", "title": "Open Gate C",              "zone": "Gate A",     "expectedReduction": 31, "estimatedTime": 2, "confidence": 96, "applied": True,  "timestamp": _ts(25)},
]

_SEED_PREDICTIONS = [
    {"zoneId": "gate_a",     "zoneName": "Gate A",     "current": 380, "in5min": 430, "in10min": 510, "in30min": 480, "predictedRisk": "critical", "confidence": 94, "capacity": 500},
    {"zoneId": "food_court", "zoneName": "Food Court", "current": 520, "in5min": 580, "in10min": 600, "in30min": 550, "predictedRisk": "critical", "confidence": 97, "capacity": 600},
    {"zoneId": "parking_a",  "zoneName": "Parking A",  "current": 420, "in5min": 460, "in10min": 490, "in30min": 500, "predictedRisk": "high",     "confidence": 89, "capacity": 500},
]

_SEED_EVENT_LOGS = [
    {"id": "e1", "time": _ts(45), "title": "Event Started",    "description": "All systems nominal.", "type": "normal",   "agent": "orchestrator"},
    {"id": "e2", "time": _ts(32), "title": "Parking A Surge",  "description": "Parking A hit 70%.",   "type": "warning",  "agent": "parking"},
    {"id": "e3", "time": _ts(25), "title": "Gate C Opened",    "description": "Crowd redistributed.", "type": "action",   "agent": "gate"},
    {"id": "e4", "time": _ts(8),  "title": "Food Court Alert", "description": "Food Court at 87%.",   "type": "critical", "agent": "crowd"},
]

_SEED_AGENTS = [
    {"id": "orchestrator", "name": "Orchestrator",    "status": "active",     "messagesProcessed": 284},
    {"id": "crowd",        "name": "Crowd Agent",     "status": "alert",      "messagesProcessed": 512},
    {"id": "parking",      "name": "Parking Agent",   "status": "processing", "messagesProcessed": 198},
    {"id": "gate",         "name": "Gate Agent",      "status": "active",     "messagesProcessed": 341},
    {"id": "ticket",       "name": "Ticket Agent",    "status": "active",     "messagesProcessed": 14834},
    {"id": "emergency",    "name": "Emergency Agent", "status": "idle",       "messagesProcessed": 47},
    {"id": "analytics",    "name": "Analytics Agent", "status": "active",     "messagesProcessed": 891},
]

# ── in-memory fallback lists ──────────────────────────────────────────────────
ZONES           = list(_SEED_ZONES)
ALERTS          = list(_SEED_ALERTS)
RECOMMENDATIONS = list(_SEED_RECS)
PREDICTIONS     = list(_SEED_PREDICTIONS)
AGENT_MESSAGES: list[dict] = []
SIMULATION_LOGS: list[dict] = []
EVENT_LOGS      = list(_SEED_EVENT_LOGS)
AGENTS          = list(_SEED_AGENTS)

# ── seed MongoDB ──────────────────────────────────────────────────────────────
def _seed_if_empty():
    if not USE_MONGO:
        return
    seedings = [
        ("zones",           _SEED_ZONES,       "id"),
        ("alerts",          _SEED_ALERTS,      "id"),
        ("recommendations", _SEED_RECS,        "id"),
        ("predictions",     _SEED_PREDICTIONS, "zoneId"),
        ("event_logs",      _SEED_EVENT_LOGS,  "id"),
        ("agents",          _SEED_AGENTS,      "id"),
    ]
    for col_name, seed, _ in seedings:
        c = _db[col_name]
        if c.count_documents({}) == 0:
            c.insert_many([dict(d) for d in seed])
            print(f"  seeded {col_name} ({len(seed)} docs)")

# ── connect (called after all definitions) ────────────────────────────────────
def _connect():
    global _client, _db, USE_MONGO
    uri = os.getenv("MONGO_URI", "")
    if not uri:
        print("[WARN] MONGO_URI not set - using in-memory store")
        return
    try:
        from pymongo import MongoClient
        _client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        _client.admin.command("ping")
        _db       = _client["eventsphere"]
        USE_MONGO = True
        print(f"[OK] MongoDB connected -> {_db.name}")
        _seed_if_empty()
    except Exception as e:
        print(f"[WARN] MongoDB unavailable ({e}) - using in-memory store")

_connect()

# ── collection accessor ───────────────────────────────────────────────────────
def col(name: str):
    if not USE_MONGO or _db is None:
        raise RuntimeError("MongoDB not connected")
    return _db[name]

# ── unified CRUD helpers ──────────────────────────────────────────────────────
def get_all(collection_name: str, fallback: list, query: dict = {}) -> list:
    if USE_MONGO:
        return [{k: v for k, v in d.items() if k != "_id"}
                for d in col(collection_name).find(query)]
    return [d for d in fallback if all(d.get(k) == v for k, v in query.items())]

def get_one(collection_name: str, fallback: list, field: str, value) -> dict | None:
    if USE_MONGO:
        d = col(collection_name).find_one({field: value})
        if d: d.pop("_id", None)
        return d
    return next((d for d in fallback if d.get(field) == value), None)

def insert_one(collection_name: str, fallback: list, doc: dict, prepend: bool = False):
    if USE_MONGO:
        col(collection_name).insert_one(dict(doc))
    else:
        if prepend: fallback.insert(0, doc)
        else:       fallback.append(doc)

def update_one(collection_name: str, fallback: list, field: str, value, updates: dict):
    if USE_MONGO:
        col(collection_name).update_one({field: value}, {"$set": updates})
    else:
        doc = next((d for d in fallback if d.get(field) == value), None)
        if doc: doc.update(updates)

def delete_one(collection_name: str, fallback: list, field: str, value):
    if USE_MONGO:
        col(collection_name).delete_one({field: value})
    else:
        idx = next((i for i, d in enumerate(fallback) if d.get(field) == value), None)
        if idx is not None: fallback.pop(idx)

# ── zone tick (live simulation) ───────────────────────────────────────────────
def tick_zones():
    zones = get_all("zones", ZONES)
    for z in zones:
        delta     = random.randint(-8, 10)
        new_crowd = max(0, min(z["maxCapacity"], z["currentCrowd"] + delta))
        new_occ   = round(new_crowd / z["maxCapacity"] * 100)
        new_risk  = _risk(new_occ)
        update_one("zones", ZONES, "id", z["id"],
                   {"currentCrowd": new_crowd, "occupancy": new_occ, "riskLevel": new_risk})
        z.update({"currentCrowd": new_crowd, "occupancy": new_occ, "riskLevel": new_risk})
    return zones
