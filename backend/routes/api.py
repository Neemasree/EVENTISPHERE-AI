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
SYSTEM_PROMPT = """You are the AI Operations Analyst for an enterprise Event Operations Command Center.
You receive live structured event data and answer operator questions like a professional operations analyst - not a chatbot.

Payload structure:
- operationalSummary: top-level snapshot (risk, visitor count, alert/incident counts, peak zone) - read this first
- zones: sorted critical-first, each with currentOccupancy, capacity, occupancyPercent, waitingTimeMin, riskLevel, and inline forecast (in5min, in10min, in30min, confidence)
- alerts: sorted by severity, most critical first
- recommendations: sorted by confidence descending, each has a priority number
- incidents: open/unresolved only
- kpis: venue-wide aggregates

Rules:
- NEVER invent, estimate, or fabricate any numbers not present in the provided data.
- If a value is not in the data, explicitly state it is unavailable.
- NEVER answer in one sentence. Always use structured markdown with icons and headings.
- Always explain WHY a situation is occurring, WHAT will happen if unaddressed, and WHAT to do.
- Keep responses between 120-220 words.
- Prioritize issues by severity. Address highest severity first.
- For comparison questions, compare specific metrics side by side from zone data.
- For "what should I do" or "next 15 min" questions, use the ranked recommendations list.
- For "what happens if no action" questions, use the forecast fields (in10min, in30min) to project consequences.
- For security/staffing questions, identify zones by riskLevel and waitingTimeMin.
- Sound like an operations command center analyst, not a chatbot.

Response format by question type:
- Risk/status/summary -> 🚨 Situation Summary: Overall Risk, Active Visitors, Primary Issue, Why, Operational Impact, Recommended Actions, Expected Improvement, Confidence
- Prediction/forecast/no action -> 📈 AI Crowd Forecast: zone, current vs predicted, timeline, consequences, recommendation, confidence
- Recommendation/priority/next 15 min/should -> 🎯 Action Plan: top 3 ranked actions with reason, expected impact, deploy time
- Comparison -> ⚖️ Zone Comparison: side-by-side metrics, load delta, assessment, recommendation
- Security/staffing -> 🛡️ Security Assessment: zones ranked by risk, recommended deployment
- General/operational -> 📊 Operational Status: summary metrics, top issues, top action

Only use data from the JSON payload. Do not add information from outside the payload."""


@api_bp.route("/ask", methods=["POST"])
def ask():
    data      = request.get_json(force=True) or {}
    question  = data.get("question", "")
    event_ctx = data.get("eventContext", {})

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key and event_ctx:
        try:
            import groq, json as _json
            client = groq.Groq(api_key=groq_key)
            user_msg = (
                f"Live event data:\n{_json.dumps(event_ctx, indent=2)}\n\n"
                f"Operator question: {question}"
            )
            resp = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_msg},
                ],
                max_tokens=500,
                temperature=0.2,
            )
            answer = resp.choices[0].message.content.strip()
            return jsonify({"answer": answer})
        except Exception:
            pass

    # Offline fallback - reads from enriched context shape
    summary   = event_ctx.get("operationalSummary", {})
    zones     = event_ctx.get("zones", [])            # sorted critical-first
    alerts    = event_ctx.get("alerts", [])           # sorted by severity
    recs      = event_ctx.get("recommendations", [])  # sorted by confidence
    risk      = summary.get("overallRisk", "Unknown")
    q         = question.lower()
    top_zone  = zones[0]  if zones  else {}
    top_rec   = recs[0]   if recs   else {}
    top_alert = alerts[0] if alerts else {}

    if any(k in q for k in ("risk", "biggest", "status", "situation", "summar", "operational")):
        answer = (
            f"## \U0001f6a8 Situation Summary\n\n"
            f"**Overall Risk:** {'\U0001f534' if risk.lower() in ('high','critical') else '\U0001f7e1'} {risk.upper()}\n\n"
            f"**Active Visitors:** {summary.get('activeVisitors','N/A'):,} / {summary.get('totalCapacity','N/A'):,} "
            f"({summary.get('occupancyPercent','N/A')}%) | Avg wait: {summary.get('avgWaitTimeMin','N/A')} min\n\n"
            f"**Primary Issue:** {top_zone.get('name','N/A')} at {top_zone.get('occupancyPercent','N/A')}% "
            f"({top_zone.get('currentOccupancy','N/A')} / {top_zone.get('capacity','N/A')}) - "
            f"Risk: {top_zone.get('riskLevel','N/A').upper()}\n\n"
            f"**Why:** {top_alert.get('message','Elevated occupancy across critical zones.')}\n\n"
            f"**Operational Impact:** Without intervention, congestion will worsen and emergency access may be compromised.\n\n"
            f"**Recommended Actions:**\n"
            f"1. {top_rec.get('action','Deploy crowd marshals to peak zones.')}\n"
            f"2. Monitor all high-risk zones every 2 minutes.\n\n"
            f"**Expected Improvement:** {top_rec.get('expectedReduction','N/A')}% crowd density reduction.\n\n"
            f"**Confidence:** {top_rec.get('confidence','N/A')}%"
        )

    elif any(k in q for k in ("predict", "forecast", "10 min", "10min", "happen if", "no action")):
        forecast = top_zone.get("forecast") or {}
        answer = (
            f"## \U0001f4c8 AI Crowd Forecast\n\n"
            f"**Most Critical Zone:** {top_zone.get('name','N/A')}\n\n"
            f"**Current Occupancy:** {top_zone.get('currentOccupancy','N/A')} / {top_zone.get('capacity','N/A')} "
            f"({top_zone.get('occupancyPercent','N/A')}%)\n\n"
            f"**In 5 min:** {forecast.get('in5min','N/A')} | "
            f"**In 10 min:** {forecast.get('in10min','N/A')} | "
            f"**In 30 min:** {forecast.get('in30min','N/A')}\n\n"
            f"**Predicted Risk:** {str(forecast.get('risk','')).upper() or 'N/A'}\n\n"
            f"**If no action taken:** Capacity will be exceeded, causing queue buildup, "
            f"reduced emergency access, and visitor safety risk.\n\n"
            f"**Recommended Action:** {top_rec.get('action','Deploy crowd marshals and open alternate zones.')}\n\n"
            f"**Confidence:** {forecast.get('confidence','N/A')}%"
        )

    elif any(k in q for k in ("recommend", "first", "implement", "15 min", "next", "should", "priority", "plan")):
        lines = ["## \U0001f3af Action Plan\n"]
        for r in recs[:3]:
            lines.append(
                f"**{r.get('priority','?')}. {r.get('title','N/A')}** (Confidence: {r.get('confidence','N/A')}%)\n"
                f"   Zone: {r.get('zone','N/A')} | Deploy in: {r.get('estimatedTimeMin','N/A')} min\n"
                f"   Action: {r.get('action','N/A')}\n"
                f"   Expected: {r.get('expectedReduction','N/A')}% reduction"
            )
        answer = "\n\n".join(lines)

    elif "compar" in q:
        mentioned = [z for z in zones if z.get("name","").lower() in q]
        pair = mentioned[:2] if len(mentioned) >= 2 else zones[:2]
        if len(pair) == 2:
            a, b = pair
            delta = (a.get("occupancyPercent",0) or 0) - (b.get("occupancyPercent",0) or 0)
            answer = (
                f"## \u2696\ufe0f Zone Comparison\n\n"
                f"**{a.get('name')}:** {a.get('currentOccupancy')} / {a.get('capacity')} "
                f"({a.get('occupancyPercent')}%) - Risk: {str(a.get('riskLevel','')).upper()} - Wait: {a.get('waitingTimeMin')} min\n\n"
                f"**{b.get('name')}:** {b.get('currentOccupancy')} / {b.get('capacity')} "
                f"({b.get('occupancyPercent')}%) - Risk: {str(b.get('riskLevel','')).upper()} - Wait: {b.get('waitingTimeMin')} min\n\n"
                f"**Load Delta:** {abs(delta)}% higher load on {a.get('name') if delta > 0 else b.get('name')}.\n\n"
                f"**Assessment:** {b.get('name') if delta > 0 else a.get('name')} has available capacity "
                f"and should absorb redirected visitors immediately."
            )
        else:
            answer = "## \u2696\ufe0f Zone Comparison\n\nInsufficient zone data. Please specify two zone names."

    elif any(k in q for k in ("security", "staff", "marshal", "deploy")):
        high_risk = [z for z in zones if z.get("riskLevel") in ("critical", "high")]
        lines = ["## \U0001f6e1\ufe0f Security Assessment\n"]
        for z in high_risk[:4]:
            lines.append(
                f"**{z.get('name')}** - {z.get('occupancyPercent')}% capacity, "
                f"Risk: {str(z.get('riskLevel','')).upper()}, Wait: {z.get('waitingTimeMin')} min "
                f"-> Deploy crowd marshals immediately."
            )
        if not high_risk:
            lines.append("All zones within safe limits. Standard staffing is sufficient.")
        answer = "\n\n".join(lines)

    else:
        answer = (
            f"## \U0001f4ca Operational Status\n\n"
            f"**Event:** {summary.get('event','N/A')} | **Risk:** {risk.upper()}\n\n"
            f"**Crowd:** {summary.get('activeVisitors','N/A'):,} / {summary.get('totalCapacity','N/A'):,} "
            f"({summary.get('occupancyPercent','N/A')}%)\n\n"
            f"**Critical Zones:** {summary.get('criticalZones','N/A')} | "
            f"**High-Risk:** {summary.get('highRiskZones','N/A')} | "
            f"**Active Alerts:** {summary.get('activeAlerts','N/A')}\n\n"
            f"**Peak Zone:** {summary.get('peakZone','N/A')} | "
            f"**Avg Wait:** {summary.get('avgWaitTimeMin','N/A')} min | "
            f"**Flow:** {summary.get('flowRatePerMin','N/A')}/min\n\n"
            f"**Top Action:** {top_rec.get('action','All zones stable - continue monitoring.')}"
        )

    return jsonify({"answer": answer})
