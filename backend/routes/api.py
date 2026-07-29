"""
Direct API endpoints called by the frontend via /api/* proxy.
Vite strips /api prefix, so these are registered at root level.
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
import os

api_bp = Blueprint("api", __name__)

# ── Severity helpers ──────────────────────────────────────────────────────────
SEV_COLOR = {"critical": "#f43f5e", "high": "#fb923c", "medium": "#fbbf24", "low": "#00f5a0"}

DEFAULT_PLANS = {
    "fire":          ["Activate fire suppression system.", "Evacuate affected zone immediately.", "Dispatch Fire Team Alpha.", "Notify all agents of evacuation route.", "Keep emergency exits clear."],
    "medical":       ["Dispatch Medical Team to location.", "Clear path for emergency access.", "Notify nearby visitors to step aside.", "Prepare medical bay for incoming patient.", "Alert orchestrator for crowd clearance."],
    "security":      ["Deploy Security Team to zone.", "Isolate affected area.", "Review CCTV footage.", "Notify law enforcement if required.", "Maintain crowd calm via PA system."],
    "lost child":    ["Broadcast description over PA.", "Station staff at all exits.", "Escort child to safe zone.", "Contact parents via announcement.", "Log incident for follow-up."],
    "crowd surge":   ["Open all available gates.", "Deploy crowd marshals.", "Activate overflow zones.", "Reduce inbound flow.", "Alert Emergency Agent."],
    "maintenance":   ["Dispatch Maintenance Team.", "Cordon off affected area.", "Reroute visitors.", "Estimate repair time.", "Update status board."],
    "power failure": ["Switch to emergency lighting.", "Initiate safe evacuation of dark zones.", "Dispatch Electrical Team.", "Notify all agents.", "Keep exits illuminated."],
}

DEFAULT_PRECAUTIONS = ["Keep emergency exits clear.", "Prevent crowd congestion near the zone."]

DISPATCH_TEAMS = {
    "fire":          ["Team Alpha — Fire/Rescue", "Team Bravo — Medical Standby", "Team Charlie — Crowd Control"],
    "medical":       ["Team Alpha — Medical/Paramedic", "Team Bravo — Security Escort", "Team Charlie — Logistics"],
    "security":      ["Team Alpha — Security", "Team Bravo — Law Enforcement Liaison", "Team Charlie — Crowd Management"],
    "lost child":    ["Team Alpha — Child Safety", "Team Bravo — PA/Comms", "Team Charlie — Exit Control"],
    "crowd surge":   ["Team Alpha — Crowd Control", "Team Bravo — Gate Management", "Team Charlie — Emergency Response"],
    "maintenance":   ["Team Alpha — Maintenance", "Team Bravo — Safety Officer", "Team Charlie — Visitor Redirect"],
    "power failure": ["Team Alpha — Electrical", "Team Bravo — Emergency Lighting", "Team Charlie — Evacuation"],
}

def _get_plan(category: str):
    key = category.lower()
    for k in DEFAULT_PLANS:
        if k in key or key in k:
            return DEFAULT_PLANS[k], DISPATCH_TEAMS.get(k, DISPATCH_TEAMS["security"])
    return DEFAULT_PLANS["security"], DISPATCH_TEAMS["security"]


# ── POST /emergency ───────────────────────────────────────────────────────────
@api_bp.route("/emergency", methods=["POST"])
def emergency():
    data     = request.get_json(force=True) or {}
    category = data.get("category", "Medical")
    location = data.get("location", "Main Stage")
    priority = data.get("priority", "High")

    plan, teams = _get_plan(category)
    known_cats  = set(DEFAULT_PLANS.keys())
    is_custom   = not any(k in category.lower() or category.lower() in k for k in known_cats)

    # Try Groq AI if key is available
    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        try:
            import groq
            client = groq.Groq(api_key=groq_key)
            prompt = (
                f"You are an emergency response AI for a live event. "
                f"A {priority} priority {category} incident has been reported at {location}. "
                f"Respond with JSON only (no markdown): "
                f"{{\"summary\": str, \"enhanced_action_plan\": [5 strings], "
                f"\"safety_precautions\": [2 strings], \"dispatch_team\": [3 strings], "
                f"\"estimated_response_time\": str, \"voice_announcement\": str}}"
            )
            resp = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                temperature=0.4,
            )
            import json as _json
            text = resp.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            ai = _json.loads(text)
            return jsonify({
                "category": category, "location": location, "severity": priority,
                "summary":                ai.get("summary", f"{category} incident at {location}."),
                "enhanced_action_plan":   ai.get("enhanced_action_plan", plan),
                "safety_precautions":     ai.get("safety_precautions", DEFAULT_PRECAUTIONS),
                "dispatch_team":          ai.get("dispatch_team", teams),
                "estimated_response_time":ai.get("estimated_response_time", "2 min"),
                "voice_announcement":     ai.get("voice_announcement", f"Attention. {category} incident near {location}. Emergency response teams have been dispatched. Please follow emergency exit signs and remain calm."),
                "timestamp":              datetime.utcnow().isoformat() + "Z",
                "is_custom_category":     is_custom,
            })
        except Exception:
            pass  # Fall through to offline response

    # Offline fallback
    return jsonify({
        "category": category, "location": location, "severity": priority,
        "summary":                f"{category} incident detected near {location}. AI response protocols activated. All response teams have been notified.",
        "enhanced_action_plan":   plan,
        "safety_precautions":     DEFAULT_PRECAUTIONS,
        "dispatch_team":          teams,
        "estimated_response_time":"2 min",
        "voice_announcement":     f"Attention all visitors. A {category} incident has been reported near {location}. Emergency response teams have been dispatched. Please follow emergency exit signs and remain calm.",
        "timestamp":              datetime.utcnow().isoformat() + "Z",
        "is_custom_category":     is_custom,
    })


# ── POST /crowd ───────────────────────────────────────────────────────────────
@api_bp.route("/crowd", methods=["POST"])
def crowd_analyse():
    data     = request.get_json(force=True) or {}
    queue    = int(data.get("queue", 0))
    capacity = int(data.get("capacity", 1))
    incoming = int(data.get("incoming_group", 0))

    projected = queue + incoming
    pct       = round((projected / capacity) * 100) if capacity else 0

    if pct >= 120:   sev, reason = "CRITICAL", "Gate limit exceeded! Immediate crowd control required."
    elif pct >= 100: sev, reason = "HIGH",     "Queue approaching capacity. Consider opening alternate gate."
    elif pct >= 70:  sev, reason = "MEDIUM",   "Queue building up. Monitor closely."
    else:            sev, reason = "LOW",       "Queue within safe limits. Flow is normal."

    recs = {
        "LOW":      ["Maintain current gate configuration."],
        "MEDIUM":   ["Pre-position crowd marshals at Gate A.", "Monitor every 2 minutes."],
        "HIGH":     ["Open Gate B immediately.", "Deploy crowd barriers.", "Notify Orchestrator Agent."],
        "CRITICAL": ["Open all gates NOW.", "Stop inbound flow.", "Deploy emergency response.", "Alert all agents."],
    }

    return jsonify({
        "status":          "ok",
        "severity":        sev,
        "reason":          reason,
        "recommendations": recs[sev],
        "data": {
            "queue":           queue,
            "capacity":        capacity,
            "projected_queue": projected,
            "occupancy_pct":   min(pct, 120),
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


# ── POST /ask ─────────────────────────────────────────────────────────────────
@api_bp.route("/ask", methods=["POST"])
def ask():
    data     = request.get_json(force=True) or {}
    question = data.get("question", "")
    context  = data.get("context", {})
    category = context.get("category", "incident")
    location = context.get("location", "venue")

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        try:
            import groq
            client = groq.Groq(api_key=groq_key)
            prompt = (
                f"You are an emergency response AI assistant at a live event. "
                f"Active incident: {category} at {location}. "
                f"Answer this question concisely (2-3 sentences max): {question}"
            )
            resp = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3,
            )
            answer = resp.choices[0].message.content.strip()
            return jsonify({"answer": answer, "confidence": "High"})
        except Exception:
            pass

    # Offline keyword fallback
    q = question.lower()
    fallbacks = {
        "gate":     f"Gate A is currently restricted due to the {category} incident. Use Gate B or C for alternative entry/exit.",
        "evacuate": f"Evacuation of the affected zone ({location}) is recommended. Emergency teams are en route.",
        "team":     f"Team Alpha is responding to {location}. ETA: 2 minutes.",
        "control":  f"The situation at {location} is being actively managed. All 3 response teams are deployed.",
        "safe":     f"Visitors near {location} should move to designated safe zones. Follow staff instructions.",
    }
    key    = next((k for k in fallbacks if k in q), None)
    answer = fallbacks[key] if key else f"The {category} incident at {location} is being handled by designated response teams. Please follow standard emergency procedures and staff instructions."
    return jsonify({"answer": answer, "confidence": "Medium"})
