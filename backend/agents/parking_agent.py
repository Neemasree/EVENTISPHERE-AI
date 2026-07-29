"""Parking Intelligence Agent — monitors lots, reroutes vehicles."""
from models.data_store import ZONES, ALERTS, AGENT_MESSAGES, RECOMMENDATIONS
from datetime import datetime
import uuid

PARKING_ZONES = ['parking_a', 'parking_b']

def analyse() -> dict:
    parking = [z for z in ZONES if z['type'] == 'parking']
    full    = [z for z in parking if z['occupancy'] >= 90]
    high    = [z for z in parking if 70 <= z['occupancy'] < 90]
    return {
        'parkingZones':  [{'id': z['id'], 'name': z['name'], 'occupancy': z['occupancy'], 'risk': z['riskLevel']} for z in parking],
        'nearCapacity':  [z['name'] for z in full],
        'highOccupancy': [z['name'] for z in high],
        'totalVehicles': sum(z['currentCrowd'] for z in parking),
        'timestamp':     datetime.utcnow().isoformat() + 'Z',
    }

def reroute(from_lot: str, to_lot: str) -> dict:
    """Redirect inbound vehicles from one lot to another."""
    src  = next((z for z in ZONES if z['id'] == from_lot), None)
    dest = next((z for z in ZONES if z['id'] == to_lot),   None)
    if not src or not dest:
        return {'error': 'Lot not found'}

    msg = {
        'id':        str(uuid.uuid4()),
        'from':      'parking',
        'to':        'orchestrator',
        'message':   f'Rerouting vehicles from {src["name"]} ({src["occupancy"]}%) to {dest["name"]} ({dest["occupancy"]}%).',
        'type':      'action',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }
    AGENT_MESSAGES.append(msg)
    return {'status': 'rerouting', 'from': src['name'], 'to': dest['name']}

def check_and_alert():
    """Auto-alert if any parking zone exceeds 85%."""
    for zone in ZONES:
        if zone['type'] == 'parking' and zone['occupancy'] >= 85:
            existing = [a for a in ALERTS if not a['dismissed'] and zone['name'] in a.get('zone','')]
            if not existing:
                ALERTS.insert(0, {
                    'id':        str(uuid.uuid4()),
                    'severity':  'high' if zone['occupancy'] < 95 else 'critical',
                    'title':     f'{zone["name"]} Near Capacity',
                    'message':   f'{zone["name"]} at {zone["occupancy"]}%. Recommend rerouting to alternate lot.',
                    'zone':      zone['name'],
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'read':      False,
                    'dismissed': False,
                })
