"""Emergency Response Agent — detects, classifies, and dispatches."""
from models.data_store import ALERTS, AGENT_MESSAGES
from datetime import datetime
import uuid

SEVERITY_MAP = {"medical": "high", "fire": "critical", "security": "high",
                "lost_child": "medium", "technical": "medium"}

def report_incident(incident_type: str, zone: str, description: str) -> dict:
    severity = SEVERITY_MAP.get(incident_type, "medium")
    incident = {
        "id":          str(uuid.uuid4()),
        "severity":    severity,
        "title":       f"{incident_type.replace('_',' ').title()} Incident",
        "message":     description,
        "zone":        zone,
        "timestamp":   datetime.utcnow().isoformat() + "Z",
        "read":        False,
        "dismissed":   False,
    }
    ALERTS.insert(0, incident)
    # Notify orchestrator
    AGENT_MESSAGES.append({
        "id": str(uuid.uuid4()), "from": "emergency", "to": "orchestrator",
        "message": f"{severity.upper()}: {incident['title']} at {zone}. Response dispatched.",
        "type": "action",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })
    return incident
