# EventiSphere AI 🎯

An AI-powered real-time event management platform that uses a multi-agent system to monitor crowd density, manage emergencies, optimize operations, and provide intelligent recommendations — all from a single dashboard.

---

## 🚀 Features

### 🧠 Multi-Agent AI System
- **Orchestrator Agent** — coordinates all agents and decision-making
- **Crowd Agent** — monitors crowd density, predicts overflow
- **Parking Agent** — manages lot capacity and rerouting
- **Gate Agent** — controls gate flow and redistribution
- **Ticket Agent** — validates tickets, blocks duplicates
- **Emergency Agent** — dispatches response teams
- **Analytics Agent** — generates reports and trend analysis

### 📊 Mission Control Dashboard
- Live KPI cards (visitors, alerts, risk level, wait time)
- Interactive venue map with zone-level occupancy
- Real-time active alerts panel

### 🗺️ Venue Map
- SVG-based interactive zone map
- Click any zone for detailed stats (donut chart, wait time, AI recommendation)
- Multi-event support — add and switch between events
- Live occupancy bars and critical zone pulse animations

### 🔥 Crowd Heatmap
- Canvas-based heat intensity map
- Color-coded by density (cool → critical)
- Critical zone pulse rings

### 👥 Crowd Intelligence
- Entrance congestion monitor with stick-figure venue visualization
- Severity analysis (LOW / MEDIUM / HIGH / CRITICAL)
- Auto-polling mode with voice alerts
- Analysis history log

### 🚨 Emergency Response Center
- Incident simulation with category, location, priority
- AI-generated response plan and dispatch teams
- Live venue mini-map highlighting affected zone
- Voice announcement broadcast
- Incident history

### 🤖 AI Agent Network
- Live agent status cards with pulse indicators
- Real-time inter-agent communication feed
- Message routing visualization

### ⚡ Scenario Simulator
- 10 pre-built scenarios (bus arrival, rain, VIP, concert start, emergency, power failure, etc.)
- Each scenario triggers real state changes across zones, alerts, agents, and timeline

### 📈 Analytics
- Hourly visitor trends
- Zone performance breakdown
- Incident analysis charts

### 🎫 Other Pages
- Ticket Scanner
- Alerts Center
- Incidents Log
- Notifications
- AI Timeline
- Event Replay

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Framer Motion** — animations
- **Zustand** — state management
- **Recharts** — analytics charts
- **React Router** — navigation
- **Lucide React** — icons

### Backend
- **Python** + **Flask**
- **Groq AI** — LLM for emergency response and crowd analysis
- Multi-agent architecture with REST API endpoints

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
python app.py
```

Runs at `http://localhost:5000`

> The frontend works fully offline without the backend — all agents fall back to local calculations.

---

## 🔑 Environment Variables

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

---

## 📁 Project Structure

```
EVENTISPHERE-AI/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── store/          # Zustand state management
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Helpers and utilities
│   └── package.json
├── backend/
│   ├── agents/             # AI agent implementations
│   ├── routes/             # Flask API routes
│   ├── models/             # Data models
│   └── app.py
└── README.md
```

---

## 🎮 Demo

On first load, a cinematic loading screen boots up the system. Use **Demo Story Mode** in the sidebar to walk through a guided simulation, or trigger scenarios manually from the Simulator page.

---

## 📄 License

MIT
