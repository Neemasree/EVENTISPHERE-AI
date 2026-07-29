# EventSphere AI — Mission Control Platform

AI-powered multi-agent event operations platform built for national hackathon competition.

## Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts · Zustand · React Query · Lucide React

**Backend:** Flask · Flask-CORS · PyMongo · Python 3.12

**Database:** MongoDB (optional — backend runs fully on in-memory store without it)

---

## Quick Start

### Frontend (required)

```bash
cd frontend
npm install       # already done
npm run dev       # starts at http://localhost:3000
```

### Backend (optional — frontend works standalone)

```bash
cd backend
pip install -r requirements.txt
python app.py     # starts at http://localhost:5000
```

---

## Pages & Features

| Route | Feature |
|---|---|
| `/dashboard` | Mission Control — Hero, KPI cards (9), Agent status, Venue, Alerts, Recommendations |
| `/venue` | Digital Twin — Interactive SVG venue map, zone click-to-detail, live occupancy bars |
| `/heatmap` | Canvas heatmap (Google Maps style) + Live crowd animation (canvas particles) |
| `/crowd` | Zone stats table, AI predictions (5/10/30 min), Risk Meter gauge |
| `/agents` | All 7 agent cards + Agent communications feed + Recommendations |
| `/simulator` | 10 scenario buttons — trigger Bus Arrival, Emergency, Concert Start etc. |
| `/analytics` | Area, Bar, Pie, Line, Incident charts with Recharts |
| `/timeline` | AI decision timeline + Agent comms side-by-side |
| `/replay` | Scrubber + play/pause/speed — replay event from 2 PM to 9 PM |
| `/alerts` | Severity-filtered alert cards with auto-dismiss |
| `/notifications` | All/Unread/Pinned tabs with pin/mark-read/dismiss |
| `/incidents` | Sortable incident history table |

---

## Demo Flow (Hackathon Presentation)

1. Open `/dashboard` — show live KPIs, animated counters, hero section
2. Open `/venue` — click zones, show ZoneDetailModal with occupancy donut
3. Open `/simulator` — click **Bus Arrives** → watch Gate A surge, agents respond
4. Open `/heatmap` — red blob appears at Gate A, pulse ring on critical zones
5. Open `/agents` — show agent messages flying between Crowd → Orchestrator → Gate
6. Back to `/dashboard` — AI Recommendation appears → click **Apply**
7. Open `/timeline` — show the full decision chain logged
8. Open `/replay` — scrub from 14:00 → 18:00, play at 2× speed
9. Open `/analytics` — show charts: peak at 18:00, Food Court highest density
10. Open `/simulator` → click **Emergency** → critical alert, 3 agents coordinate

---

## Architecture

```
ORCHESTRATOR AGENT (brain)
        │
┌───────┼──────────┬──────────┬──────────┬──────────┐
│       │          │          │          │          │
Crowd  Parking   Gate      Ticket   Emergency  Analytics
Agent   Agent    Agent      Agent     Agent      Agent
```

Every scenario trigger propagates through the Orchestrator and updates:
- Zone occupancy + risk levels
- Active alerts
- Agent message feed
- Event timeline
- KPI cards

---

## Backend API Reference

```
GET  /crowd/status           → live zones + KPI
POST /crowd/analyse          → AI crowd analysis
GET  /crowd/predictions      → 5/10/30 min predictions

GET  /alerts/                → active alerts
POST /alerts/                → create alert
PATCH /alerts/:id/dismiss    → dismiss alert
GET  /alerts/recommendations → AI recommendations
POST /alerts/recommendations/:id/apply

GET  /agents/status          → all agent statuses
POST /agents/message         → send agent message
GET  /agents/decisions       → orchestrator decisions

GET  /analytics/kpi          → KPI summary
GET  /analytics/hourly       → hourly visitor data
GET  /analytics/report       → full event report

POST /simulator/trigger      → trigger scenario
GET  /simulator/logs         → simulation log

GET  /zones/                 → all zones
GET  /zones/:id              → zone + prediction
PATCH /zones/:id/update      → update zone data
```

---

## MongoDB Collections (when connected)

- `crowd_status` — live zone snapshots
- `crowd_history` — historical crowd data
- `zones` — zone configuration
- `alerts` — all alerts
- `recommendations` — AI recommendations
- `predictions` — crowd predictions
- `notifications` — system notifications
- `agent_messages` — cross-agent communications
- `simulation_logs` — scenario trigger logs
- `event_logs` — timeline events

---

## Accessibility

- Full keyboard navigation via React Router links
- ARIA labels on interactive elements
- Colour-blind safe status indicators (shape + label, not colour alone)
- High contrast dark theme throughout
- Screen reader labels on icon-only buttons
