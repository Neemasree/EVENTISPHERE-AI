"""Ticket Intelligence Agent — QR verification, duplicate detection, fraud blocking."""
from models.data_store import ALERTS, AGENT_MESSAGES
from datetime import datetime
import uuid, random, string

# Simulated ticket registry (valid ticket IDs)
TICKET_REGISTRY: dict[str, dict] = {}
SCANNED_TICKETS: set[str] = set()
SCAN_LOG: list[dict] = []

def _gen_ticket_id() -> str:
    return 'EVT-2024-' + ''.join(random.choices(string.digits, k=5))

def _seed_registry(count: int = 200):
    """Pre-populate the ticket registry for the demo."""
    for i in range(count):
        tid = f'EVT-2024-{15400 + i:05d}'
        TICKET_REGISTRY[tid] = {
            'id':      tid,
            'visitor': f'Visitor {i + 1}',
            'gate':    random.choice(['Gate A', 'Gate B', 'Gate C']),
            'seat':    f'Sector {random.choice("ABCD")}, Row {random.randint(1,20)}',
            'vip':     i < 10,
        }

_seed_registry()

def verify(ticket_id: str, gate: str) -> dict:
    """Verify a ticket. Returns status: verified | duplicate | invalid."""
    ts = datetime.utcnow().isoformat() + 'Z'

    if ticket_id not in TICKET_REGISTRY:
        result = {'status': 'invalid', 'ticketId': ticket_id, 'reason': 'Ticket not found in registry', 'timestamp': ts}
        SCAN_LOG.append(result)
        _notify_fraud(ticket_id, gate, 'Invalid ticket')
        return result

    if ticket_id in SCANNED_TICKETS:
        result = {'status': 'duplicate', 'ticketId': ticket_id, 'reason': 'Already scanned', 'timestamp': ts}
        SCAN_LOG.append(result)
        _notify_fraud(ticket_id, gate, 'Duplicate ticket attempt')
        return result

    SCANNED_TICKETS.add(ticket_id)
    ticket = TICKET_REGISTRY[ticket_id]
    result = {
        'status':   'verified',
        'ticketId': ticket_id,
        'visitor':  ticket['visitor'],
        'gate':     gate,
        'seat':     ticket['seat'],
        'vip':      ticket['vip'],
        'timestamp': ts,
    }
    SCAN_LOG.append(result)
    return result

def _notify_fraud(ticket_id: str, gate: str, reason: str):
    ALERTS.insert(0, {
        'id':        str(uuid.uuid4()),
        'severity':  'medium',
        'title':     f'Ticket Fraud Detected — {gate}',
        'message':   f'{reason}: {ticket_id}. Security notified.',
        'zone':      gate,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'read':      False,
        'dismissed': False,
    })
    AGENT_MESSAGES.append({
        'id':        str(uuid.uuid4()),
        'from':      'ticket',
        'to':        'orchestrator',
        'message':   f'Fraud detected at {gate}: {ticket_id} — {reason}.',
        'type':      'warning',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    })

def get_stats() -> dict:
    total    = len(SCAN_LOG)
    verified = sum(1 for s in SCAN_LOG if s['status'] == 'verified')
    rejected = total - verified
    return {
        'totalScanned': total,
        'verified':     verified,
        'rejected':     rejected,
        'fraudRate':    round(rejected / max(total, 1) * 100, 2),
        'recentScans':  SCAN_LOG[-10:],
    }
