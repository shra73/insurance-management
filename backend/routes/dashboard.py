from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from utils.decorators import roles_required
from decimal import Decimal
from sqlalchemy import func, case
from extensions import db
from models.customer import Customer
from models.policy import Policy
from models.claim import Claim
from models.premium import PremiumPayment
from models.document import Document

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




@dashboard_bp.route("/dashboard/summary", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def dashboard_summary():
    try:
        # --- Customers ---
        total_customers = db.session.query(func.count(Customer.id)).scalar() or 0

        # --- Policies: total + count per status in a single query ---
        policy_counts = db.session.query(
            func.count(Policy.id).label("total"),
            func.sum(case((Policy.status == "ACTIVE", 1), else_=0)).label("active"),
            func.sum(case((Policy.status == "EXPIRED", 1), else_=0)).label("expired"),
            func.sum(case((Policy.status == "CANCELLED", 1), else_=0)).label("cancelled"),
        ).one()

        # --- Claims: total + count per status in a single query ---
        claim_counts = db.session.query(
            func.count(Claim.id).label("total"),
            func.sum(case((Claim.status == "PENDING", 1), else_=0)).label("pending"),
            func.sum(case((Claim.status == "UNDER_REVIEW", 1), else_=0)).label("under_review"),
            func.sum(case((Claim.status == "APPROVED", 1), else_=0)).label("approved"),
            func.sum(case((Claim.status == "REJECTED", 1), else_=0)).label("rejected"),
            func.sum(case((Claim.status == "SETTLED", 1), else_=0)).label("settled"),
        ).one()

        # --- Premiums: total collected (PAID only) and total policy premium ---
        total_collected = db.session.query(
            func.coalesce(func.sum(PremiumPayment.amount), 0)
        ).filter(PremiumPayment.payment_status == "PAID").scalar()

        total_policy_premium = db.session.query(
            func.coalesce(func.sum(Policy.premium_amount), 0)
        ).scalar()

        total_collected = Decimal(total_collected)
        total_policy_premium = Decimal(total_policy_premium)
        outstanding_amount = total_policy_premium - total_collected

        # --- Documents ---
        total_documents = db.session.query(func.count(Document.id)).scalar() or 0

        return jsonify({
            "customers": {
                "total_customers": total_customers
            },
            "policies": {
                "total_policies": policy_counts.total or 0,
                "active_policies": int(policy_counts.active or 0),
                "expired_policies": int(policy_counts.expired or 0),
                "cancelled_policies": int(policy_counts.cancelled or 0)
            },
            "claims": {
                "total_claims": claim_counts.total or 0,
                "pending": int(claim_counts.pending or 0),
                "under_review": int(claim_counts.under_review or 0),
                "approved": int(claim_counts.approved or 0),
                "rejected": int(claim_counts.rejected or 0),
                "settled": int(claim_counts.settled or 0)
            },
            "premiums": {
                "total_collected": str(total_collected),
                "outstanding_amount": str(outstanding_amount)
            },
            "documents": {
                "total_documents": total_documents
            }
        }), 200

    except Exception:
        return jsonify({
            "error": "An unexpected error occurred while generating the dashboard summary"
        }), 500
    