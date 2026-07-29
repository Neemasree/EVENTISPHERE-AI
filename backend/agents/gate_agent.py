"""Gate Intelligence Agent — monitors queues, opens/closes gates."""
from models.data_store import ZONES, ALERTS, AGENT_MESSAGES
from datetime import datetime
import uuid

GATE_ZONES = ['gate_a', 'gate_b', 'gate_c']

def analyse() -> dict:
    gates = [z for z in ZONES if z['type'] == 'gate']
    congested = [z for z in gates if z['occupancy'] >= 70]
    underused = [z for z in gates if z['occupancy'] < 30]
    return {
        'gates':     [{'id': z['id'], 'name': z['name'], 'occupancy': z['occupancy'], 'waitTime': z['waitingTime'], 'risk': z['riskLevel']} for z in gates],
        'congested': [z['name'] for z in congested],
        'underused': [z['name'] for z in underused],
        'avgWait':   round(sum(z['waitingTime'] for z in gates) / max(len(gates), 1)),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }

def open_gate(gate_id: str) -> dict:
    gate = next((z for z in ZONES if z['id'] == gate_id), None)
    if not gate:
        return {'error': 'Gate not found'}

    # Simulate opening — reduce waitingTime
    gate['waitingTime'] = max(0, gate['waitingTime'] - 3)
    msg = {
        'id':        str(uuid.uuid4()),
        'from':      'gate',
        'to':        'orchestrator',
        'message':   f'{gate["name"]} opened. Signage updated. Monitoring crowd redistribution.',
        'type':      'response',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }
    AGENT_MESSAGES.append(msg)
    return {'status': 'opened', 'gate': gate['name']}

def balance_queues() -> list:
    """Auto-balance: if one gate > 80% and another < 30%, suggest redirect."""
    gates      = [z for z in ZONES if z['type'] == 'gate']
    congested  = [z for z in gates if z['occupancy'] >= 80]
    available  = [z for z in gates if z['occupancy'] < 30]
    actions    = []
    for c in congested:
        for a in available:
            actions.append({
                'action':  'redirect',
                'from':    c['name'],
                'to':      a['name'],
                'message': f'Redirect visitors from {c["name"]} ({c["occupancy"]}%) to {a["name"]} ({a["occupancy"]}%)',
            })
    return actions
