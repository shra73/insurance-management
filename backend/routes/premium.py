from decimal import Decimal, InvalidOperation
from datetime import datetime
import logging
from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.premium import PremiumPayment
from models.policy import Policy
from utils.decorators import roles_required
from services.email_service import send_premium_payment_email

logger = logging.getLogger(__name__)

premium_bp = Blueprint("premium", __name__, url_prefix="/api/premiums")

VALID_PAYMENT_STATUSES = ("PENDING", "PAID", "FAILED", "PARTIAL")
MAX_PER_PAGE = 100
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10


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
        policy = Policy.query.with_for_update().get(policy_id)
        if not policy:
            db.session.rollback()
            return jsonify({"error": "Policy not found"}), 404

        if payment_status == "PAID":
            current_total_paid = db.session.query(
                db.func.coalesce(db.func.sum(PremiumPayment.amount), 0)
            ).filter(
                PremiumPayment.policy_id == policy.id,
                PremiumPayment.payment_status == "PAID"
            ).scalar()

            current_total_paid = Decimal(current_total_paid)
            projected_total = current_total_paid + amount

            if projected_total > policy.premium_amount:
                db.session.rollback()
                return jsonify({
                    "error": "Payment amount exceeds the outstanding premium amount"
                }), 409

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

    if payment_status == "PAID":
        try:
            customer = policy.customer

            paid_before_this_payment = db.session.query(
                db.func.coalesce(db.func.sum(PremiumPayment.amount), 0)
            ).filter(
                PremiumPayment.policy_id == policy.id,
                PremiumPayment.payment_status == "PAID",
                PremiumPayment.id != new_premium.id
            ).scalar()
            paid_before_this_payment = Decimal(paid_before_this_payment)

            previous_outstanding = policy.premium_amount - paid_before_this_payment
            remaining_outstanding = previous_outstanding - amount

            success, error_message = send_premium_payment_email(
                customer.email, customer.name, new_premium, policy,
                previous_outstanding, remaining_outstanding
            )
            if not success:
                logger.error(
                    f"Premium payment receipt email failed to send. "
                    f"premium_id={new_premium.id}, policy_id={policy.id}, reason={error_message}"
                )
        except Exception:
            logger.error(
                f"Unexpected error while attempting to send premium payment receipt email. "
                f"premium_id={new_premium.id}, policy_id={policy.id}"
            )

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


@premium_bp.route("", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_premiums():
    page_raw = request.args.get("page", str(DEFAULT_PAGE))
    per_page_raw = request.args.get("per_page", str(DEFAULT_PER_PAGE))
    search = request.args.get("search", "").strip()

    filter_status = request.args.get("payment_status", "").strip()
    filter_policy_id_raw = request.args.get("policy_id", "").strip()
    filter_policy_type = request.args.get("policy_type", "").strip()

    try:
        page = int(page_raw)
        if page < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'page' parameter. Must be a positive integer"}), 400

    try:
        per_page = int(per_page_raw)
        if per_page < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'per_page' parameter. Must be a positive integer"}), 400

    if per_page > MAX_PER_PAGE:
        return jsonify({"error": f"'per_page' cannot exceed {MAX_PER_PAGE}"}), 400

    if filter_status and filter_status not in VALID_PAYMENT_STATUSES:
        return jsonify({
            "error": "Invalid 'payment_status' filter",
            "allowed_statuses": list(VALID_PAYMENT_STATUSES)
        }), 400

    filter_policy_id = None
    if filter_policy_id_raw:
        if not filter_policy_id_raw.isdigit():
            return jsonify({"error": "Invalid 'policy_id' filter. Must be a positive integer"}), 400
        filter_policy_id = int(filter_policy_id_raw)

    query = PremiumPayment.query.join(Policy, PremiumPayment.policy_id == Policy.id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                PremiumPayment.payment_reference.ilike(search_pattern),
                Policy.policy_number.ilike(search_pattern)
            )
        )

    if filter_status:
        query = query.filter(PremiumPayment.payment_status == filter_status)
    if filter_policy_id is not None:
        query = query.filter(PremiumPayment.policy_id == filter_policy_id)
    if filter_policy_type:
        query = query.filter(Policy.type.ilike(f"%{filter_policy_type}%"))

    query = query.order_by(
        desc(PremiumPayment.payment_date).nullslast(),
        desc(PremiumPayment.created_at)
    )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    premiums = []
    for payment in pagination.items:
        premiums.append({
            "id": payment.id,
            "policy_id": payment.policy_id,
            "policy_number": payment.policy.policy_number,
            "amount": str(payment.amount),
            "payment_status": payment.payment_status,
            "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
            "payment_reference": payment.payment_reference,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else None
        })

    return jsonify({
        "premiums": premiums,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200
