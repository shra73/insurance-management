from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from utils.decorators import roles_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


@dashboard_bp.route("/admin/dashboard", methods=["GET"])
@roles_required("ADMIN")
def admin_dashboard():
    user_id = get_jwt_identity()
    return jsonify({
        "message": "Welcome to the Admin dashboard",
        "user_id": user_id,
        "role": get_jwt().get("role")
    }), 200


@dashboard_bp.route("/agent/dashboard", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def agent_dashboard():
    user_id = get_jwt_identity()
    return jsonify({
        "message": "Welcome to the Agent dashboard",
        "user_id": user_id,
        "role": get_jwt().get("role")
    }), 200


@dashboard_bp.route("/customer/dashboard", methods=["GET"])
@roles_required("CUSTOMER")
def customer_dashboard():
    user_id = get_jwt_identity()
    return jsonify({
        "message": "Welcome to the Customer dashboard",
        "user_id": user_id,
        "role": get_jwt().get("role")
    }), 200