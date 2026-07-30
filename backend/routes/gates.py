from flask import Blueprint, jsonify, request
from agents.gate_agent import analyse, open_gate, balance_queues

gates_bp = Blueprint("gates", __name__)

@gates_bp.route("/analyse", methods=["GET"])
def gates_analyse():
    return jsonify(analyse())

@gates_bp.route("/open", methods=["POST"])
def gate_open():
    data = request.get_json(force=True) or {}
    gate_id = data.get("gate_id", "")
    if not gate_id:
        return jsonify({"error": "gate_id required"}), 400
    return jsonify(open_gate(gate_id))

@gates_bp.route("/balance", methods=["GET"])
def gate_balance():
    return jsonify({"actions": balance_queues()})
