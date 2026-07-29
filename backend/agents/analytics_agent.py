"""Analytics Intelligence Agent — event metrics, trend analysis, reporting."""
from models.data_store import ZONES, ALERTS, AGENT_MESSAGES, EVENT_LOGS, SIMULATION_LOGS
from utils.ai_engine import compute_kpi
from datetime import datetime
import uuid

SNAPSHOT_HISTORY: list[dict] = []

def snapshot() -> dict:
    """Take a KPI snapshot at the current moment."""
    kpi  = compute_kpi()
    snap = {
        'id':        str(uuid.uuid4()),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'kpi':       kpi,
        'zones':     [{'id': z['id'], 'name': z['name'], 'occupancy': z['occupancy'], 'risk': z['riskLevel']} for z in ZONES],
        'alerts':    len([a for a in ALERTS if not a['dismissed']]),
    }
    SNAPSHOT_HISTORY.append(snap)
    # Log to agent messages
    AGENT_MESSAGES.append({
        'id':        str(uuid.uuid4()),
        'from':      'analytics',
        'to':        'orchestrator',
        'message':   f'Snapshot recorded: {kpi["occupancyPercent"]}% occupancy, {kpi["riskLevel"]} risk, {snap["alerts"]} active alerts.',
        'type':      'info',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    })
    return snap

def get_insights() -> dict:
    """Generate AI insights from current data."""
    kpi      = compute_kpi()
    critical = [z for z in ZONES if z['riskLevel'] == 'critical']
    high     = [z for z in ZONES if z['riskLevel'] == 'high']
    insights = []

    if critical:
        insights.append({
            'level':   'critical',
            'message': f'{len(critical)} zone(s) at critical capacity: {", ".join(z["name"] for z in critical)}',
        })
    if kpi['avgWaitTime'] > 8:
        insights.append({
            'level':   'warning',
            'message': f'Average wait time {kpi["avgWaitTime"]} min exceeds 8-min threshold.',
        })
    if kpi['occupancyPercent'] > 80:
        insights.append({
            'level':   'warning',
            'message': f'Overall occupancy at {kpi["occupancyPercent"]}%. Recommend proactive crowd management.',
        })
    if not insights:
        insights.append({'level': 'info', 'message': 'All systems nominal. Crowd flow is within expected parameters.'})

    return {
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'kpi':         kpi,
        'insights':    insights,
        'snapshotCount': len(SNAPSHOT_HISTORY),
        'eventLogs':   len(EVENT_LOGS),
        'simLogs':     len(SIMULATION_LOGS),
    }

def generate_report() -> dict:
    kpi = compute_kpi()
    return {
        'title':       'EventiSphere AI — Event Operations Report',
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'summary':     f'Event running at {kpi["occupancyPercent"]}% capacity. Risk level: {kpi["riskLevel"].upper()}.',
        'kpi':         kpi,
        'topInsights': get_insights()['insights'],
        'snapshots':   len(SNAPSHOT_HISTORY),
        'totalAlerts': len(ALERTS),
        'resolvedAlerts': len([a for a in ALERTS if a['dismissed']]),
    }
