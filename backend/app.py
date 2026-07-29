from flask import Flask
from flask_cors import CORS
from routes.crowd import crowd_bp
from routes.agents import agents_bp
from routes.zones import zones_bp
from routes.alerts import alerts_bp
from routes.analytics import analytics_bp
from routes.simulator import simulator_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.register_blueprint(crowd_bp,     url_prefix="/crowd")
app.register_blueprint(agents_bp,    url_prefix="/agents")
app.register_blueprint(zones_bp,     url_prefix="/zones")
app.register_blueprint(alerts_bp,    url_prefix="/alerts")
app.register_blueprint(analytics_bp, url_prefix="/analytics")
app.register_blueprint(simulator_bp, url_prefix="/simulator")

@app.route("/health")
def health():
    return {"status": "ok", "service": "EventSphere AI Backend"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
