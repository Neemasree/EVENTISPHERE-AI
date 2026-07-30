from flask import Blueprint, jsonify, request
from agents import parking_agent

parking_bp = Blueprint("parking", __name__)


@parking_bp.route("/analyse", methods=["GET"])
def parking_analyse():
    return jsonify(parking_agent.analyse())


@parking_bp.route("/report", methods=["GET"])
def parking_report():
    return jsonify(parking_agent.generate_report())


@parking_bp.route("/reroute", methods=["POST"])
def parking_reroute():
    data = request.get_json(force=True) or {}
    return jsonify(parking_agent.reroute(
        data.get("from_lot", ""),
        data.get("to_lot", "")
    ))
