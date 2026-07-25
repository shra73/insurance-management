import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.policy import Policy
from models.customer import Customer
from utils.decorators import roles_required
from decimal import Decimal, InvalidOperation

policy_bp = Blueprint("policy", __name__, url_prefix="/api/policies")

VALID_STATUSES = ("ACTIVE", "EXPIRED", "CANCELLED", "PENDING")
MAX_PER_PAGE = 100
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10


@policy_bp.route("", methods=["POST"])
@roles_required("ADMIN", "AGENT")
def create_policy():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    customer_id = data.get("customer_id")
    policy_number = data.get("policy_number")
    policy_type = data.get("type")
    start_date_raw = data.get("start_date")
    end_date_raw = data.get("end_date")
    premium_amount = data.get("premium_amount")
    status = data.get("status")

    missing_fields = [
        field for field, value in
        [("customer_id", customer_id), ("policy_number", policy_number), ("type", policy_type),
         ("start_date", start_date_raw), ("end_date", end_date_raw),
         ("premium_amount", premium_amount), ("status", status)]
        if value in (None, "")
    ]
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    if not isinstance(customer_id, int):
        return jsonify({"error": "'customer_id' must be an integer"}), 400

    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    try:
        start_date = datetime.strptime(start_date_raw, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_raw, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD"}), 400

    if end_date <= start_date:
        return jsonify({"error": "'end_date' must be after 'start_date'"}), 400

    try:
        premium_amount = float(premium_amount)
        if premium_amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "'premium_amount' must be a positive number"}), 400

    if status not in VALID_STATUSES:
        return jsonify({"error": "Invalid status", "allowed_statuses": list(VALID_STATUSES)}), 400

    existing_policy = Policy.query.filter_by(policy_number=policy_number).first()
    if existing_policy:
        return jsonify({"error": "A policy with this policy_number already exists"}), 409

    try:
        new_policy = Policy(
            customer_id=customer_id,
            policy_number=policy_number,
            type=policy_type,
            start_date=start_date,
            end_date=end_date,
            premium_amount=premium_amount,
            status=status
        )
        db.session.add(new_policy)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A policy with this policy_number already exists"}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while creating the policy"}), 500

    return jsonify({"message": "Policy created successfully", "policy": new_policy.to_dict()}), 201


@policy_bp.route("", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_policies():
    page_raw = request.args.get("page", str(DEFAULT_PAGE))
    per_page_raw = request.args.get("per_page", str(DEFAULT_PER_PAGE))
    search = request.args.get("search", "").strip()

    filter_status = request.args.get("status", "").strip()
    filter_type = request.args.get("type", "").strip()
    filter_customer_id_raw = request.args.get("customer_id", "").strip()

    # Validate page
    try:
        page = int(page_raw)
        if page < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'page' parameter. Must be a positive integer"}), 400

    # Validate per_page
    try:
        per_page = int(per_page_raw)
        if per_page < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'per_page' parameter. Must be a positive integer"}), 400

    if per_page > MAX_PER_PAGE:
        return jsonify({"error": f"'per_page' cannot exceed {MAX_PER_PAGE}"}), 400

    # Validate status filter
    if filter_status and filter_status not in VALID_STATUSES:
        return jsonify({
            "error": "Invalid 'status' filter",
            "allowed_statuses": list(VALID_STATUSES)
        }), 400

    # Validate customer_id filter
    filter_customer_id = None
    if filter_customer_id_raw:
        if not filter_customer_id_raw.isdigit():
            return jsonify({"error": "Invalid 'customer_id' filter. Must be a positive integer"}), 400
        filter_customer_id = int(filter_customer_id_raw)

    query = Policy.query

    # Free-text search across policy_number, type, status (case-insensitive)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Policy.policy_number.ilike(search_pattern),
                Policy.type.ilike(search_pattern),
                Policy.status.ilike(search_pattern)
            )
        )

    # Optional filters
    if filter_status:
        query = query.filter(Policy.status == filter_status)
    if filter_type:
        query = query.filter(Policy.type.ilike(f"%{filter_type}%"))
    if filter_customer_id is not None:
        query = query.filter(Policy.customer_id == filter_customer_id)

    query = query.order_by(Policy.id.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    policies = [policy.to_dict() for policy in pagination.items]

    return jsonify({
        "policies": policies,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200



@policy_bp.route("/<policy_id>", methods=["PUT"])
@roles_required("ADMIN", "AGENT")
def update_policy(policy_id):
    if not policy_id.isdigit():
        return jsonify({"error": "Invalid policy ID. Must be a positive integer"}), 400

    policy = Policy.query.get(int(policy_id))
    if not policy:
        return jsonify({"error": "Policy not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # Reject any attempt to modify the ID
    if "id" in data:
        return jsonify({"error": "Policy ID cannot be modified"}), 400

    allowed_fields = {
        "customer_id", "policy_number", "type",
        "start_date", "end_date", "premium_amount", "status"
    }
    unknown_fields = [key for key in data.keys() if key not in allowed_fields]
    if unknown_fields:
        return jsonify({
            "error": "Unsupported fields in request",
            "fields": unknown_fields
        }), 400

    # --- Validate customer_id if provided ---
    new_customer_id = None
    if "customer_id" in data:
        new_customer_id = data["customer_id"]
        if not isinstance(new_customer_id, int):
            return jsonify({"error": "'customer_id' must be an integer"}), 400

        customer = Customer.query.get(new_customer_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

    # --- Validate policy_number if provided ---
    new_policy_number = None
    if "policy_number" in data:
        new_policy_number = data["policy_number"]
        if not new_policy_number:
            return jsonify({"error": "'policy_number' cannot be empty"}), 400

        existing_policy = Policy.query.filter(
            Policy.policy_number == new_policy_number,
            Policy.id != policy.id
        ).first()
        if existing_policy:
            return jsonify({"error": "A policy with this policy_number already exists"}), 409

    # --- Validate type if provided ---
    new_type = None
    if "type" in data:
        new_type = data["type"]
        if not new_type:
            return jsonify({"error": "'type' cannot be empty"}), 400

    # --- Validate start_date / end_date if provided ---
    new_start_date = None
    if "start_date" in data:
        try:
            new_start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format for start_date. Expected YYYY-MM-DD"}), 400

    new_end_date = None
    if "end_date" in data:
        try:
            new_end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format for end_date. Expected YYYY-MM-DD"}), 400

    # Cross-check date ordering using whichever values will actually apply after update
    effective_start_date = new_start_date if new_start_date is not None else policy.start_date
    effective_end_date = new_end_date if new_end_date is not None else policy.end_date

    if effective_end_date <= effective_start_date:
        return jsonify({"error": "'end_date' must be after 'start_date'"}), 400

    # --- Validate premium_amount if provided ---
    new_premium_amount = None
    if "premium_amount" in data:
        try:
            new_premium_amount = Decimal(str(data["premium_amount"]))
            if new_premium_amount <= 0:
                raise InvalidOperation
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "'premium_amount' must be a positive monetary value"}), 400

    # --- Validate status if provided ---
    new_status = None
    if "status" in data:
        new_status = data["status"]
        if new_status not in VALID_STATUSES:
            return jsonify({
                "error": "Invalid status",
                "allowed_statuses": list(VALID_STATUSES)
            }), 400

    # --- Apply updates (only fields actually present in the request) ---
    try:
        if new_customer_id is not None:
            policy.customer_id = new_customer_id
        if new_policy_number is not None:
            policy.policy_number = new_policy_number
        if new_type is not None:
            policy.type = new_type
        if new_start_date is not None:
            policy.start_date = new_start_date
        if new_end_date is not None:
            policy.end_date = new_end_date
        if new_premium_amount is not None:
            policy.premium_amount = new_premium_amount
        if new_status is not None:
            policy.status = new_status

        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A policy with this policy_number already exists"}), 409

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while updating the policy"}), 500

    return jsonify({
        "message": "Policy updated successfully",
        "policy": policy.to_dict()
    }), 200
