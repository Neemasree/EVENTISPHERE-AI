from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

from routes.crowd     import crowd_bp
from routes.agents    import agents_bp
from routes.zones     import zones_bp
from routes.alerts    import alerts_bp
from routes.analytics import analytics_bp
from routes.simulator import simulator_bp
from routes.tickets   import tickets_bp
from routes.parking   import parking_bp
from routes.gates     import gates_bp
from routes.api       import api_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(crowd_bp,     url_prefix="/crowd")
app.register_blueprint(agents_bp,    url_prefix="/agents")
app.register_blueprint(zones_bp,     url_prefix="/zones")
app.register_blueprint(alerts_bp,    url_prefix="/alerts")
app.register_blueprint(analytics_bp, url_prefix="/analytics")
app.register_blueprint(simulator_bp, url_prefix="/simulator")
app.register_blueprint(tickets_bp,   url_prefix="/tickets")
app.register_blueprint(parking_bp,   url_prefix="/parking")
app.register_blueprint(gates_bp,     url_prefix="/gates")
app.register_blueprint(api_bp)  # root-level: /emergency, /crowd, /ask

@app.route("/health")
def health():
    return {"status": "ok", "service": "EventiSphere AI Backend", "version": "2.0"}

@app.route("/")
def root():
    return {
        "service":   "EventiSphere AI",
        "status":    "running",
        "endpoints": ["/health", "/crowd", "/agents", "/zones", "/alerts", "/analytics", "/simulator", "/tickets", "/parking", "/gates", "/emergency", "/ask"],
    }

if __name__ == "__main__":
    import sys
    # Force UTF-8 stdout so Unicode chars don't crash on Windows cp1252 terminals
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
    # Start orchestrator background thread
    from agents.orchestrator import start_orchestrator
    start_orchestrator()
    print("[OK] Orchestrator AI started")
    print("[OK] EventiSphere AI backend running on port 5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
