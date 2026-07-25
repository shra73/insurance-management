from decimal import Decimal, InvalidOperation
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.premium import PremiumPayment
from models.policy import Policy
from utils.decorators import roles_required

premium_bp = Blueprint("premium", __name__, url_prefix="/api/premiums")

VALID_PAYMENT_STATUSES = ("PENDING", "PAID", "FAILED", "PARTIAL")


@premium_bp.route("", methods=["POST"])
@roles_required("ADMIN", "AGENT")
def create_premium():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    policy_id = data.get("policy_id")
    amount_raw = data.get("amount")
    payment_status = data.get("payment_status")
    payment_date_raw = data.get("payment_date")
    payment_reference = data.get("payment_reference")

    if policy_id is None:
        return jsonify({"error": "'policy_id' is required"}), 400
    if not isinstance(policy_id, int):
        return jsonify({"error": "'policy_id' must be an integer"}), 400

    policy = Policy.query.get(policy_id)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404

    if amount_raw is None or amount_raw == "":
        return jsonify({"error": "'amount' is required"}), 400
    try:
        amount = Decimal(str(amount_raw))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "'amount' must be a valid monetary value"}), 400
    if amount <= 0:
        return jsonify({"error": "'amount' must be a positive monetary value"}), 400

    if not payment_status:
        return jsonify({"error": "'payment_status' is required"}), 400
    if payment_status not in VALID_PAYMENT_STATUSES:
        return jsonify({
            "error": "Invalid payment_status",
            "allowed_statuses": list(VALID_PAYMENT_STATUSES)
        }), 400

    payment_date = None
    if payment_date_raw:
        try:
            payment_date = datetime.strptime(payment_date_raw, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format for payment_date. Expected YYYY-MM-DD"}), 400

    if payment_status == "PAID" and payment_date is None:
        return jsonify({"error": "'payment_date' is required when payment_status is PAID"}), 400

    if payment_status == "PENDING" and payment_date is not None:
        return jsonify({"error": "'payment_date' should not be set when payment_status is PENDING"}), 400

    if payment_status == "FAILED" and payment_date is not None:
        return jsonify({"error": "'payment_date' should not be set when payment_status is FAILED"}), 400

    if payment_reference:
        existing = PremiumPayment.query.filter_by(payment_reference=payment_reference).first()
        if existing:
            return jsonify({"error": "A premium payment with this payment_reference already exists"}), 409

    try:
        new_premium = PremiumPayment(
            policy_id=policy_id,
            amount=amount,
            payment_status=payment_status,
            payment_date=payment_date,
            payment_reference=payment_reference if payment_reference else None
        )
        db.session.add(new_premium)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A premium payment with this payment_reference already exists"}), 409

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while recording the premium payment"}), 500

    return jsonify({
        "message": "Premium payment recorded successfully",
        "premium": new_premium.to_dict()
    }), 201


@premium_bp.route("/policy/<policy_id>", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_premium_history(policy_id):
    if not policy_id.isdigit():
        return jsonify({"error": "Invalid policy ID. Must be a positive integer"}), 400

    policy = Policy.query.get(int(policy_id))
    if not policy:
        return jsonify({"error": "Policy not found"}), 404

    payments = PremiumPayment.query.filter_by(policy_id=policy.id).order_by(
        desc(PremiumPayment.payment_date).nullslast(),
        desc(PremiumPayment.created_at)
    ).all()

    total_paid = sum(
        (payment.amount for payment in payments if payment.payment_status == "PAID"),
        Decimal("0.00")
    )

    outstanding_amount = policy.premium_amount - total_paid

    return jsonify({
        "policy": {
            "id": policy.id,
            "policy_number": policy.policy_number,
            "premium_amount": str(policy.premium_amount)
        },
        "summary": {
            "total_paid": str(total_paid),
            "outstanding_amount": str(outstanding_amount)
        },
        "payments": [payment.to_dict() for payment in payments]
    }), 200
