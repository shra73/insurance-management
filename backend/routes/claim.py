from decimal import Decimal, InvalidOperation
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.claim import Claim
from models.policy import Policy
from utils.decorators import roles_required
from sqlalchemy import desc

claim_bp = Blueprint("claim", __name__, url_prefix="/api/claims")

VALID_CLAIM_STATUSES = ("PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED")
DEFAULT_STATUS = "PENDING"
MAX_DESCRIPTION_LENGTH = 2000


@claim_bp.route("", methods=["POST"])
@roles_required("ADMIN", "AGENT")
def create_claim():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    policy_id = data.get("policy_id")
    claim_number = data.get("claim_number")
    claim_amount_raw = data.get("claim_amount")
    claim_date_raw = data.get("claim_date")
    status = data.get("status", DEFAULT_STATUS)
    description = data.get("description")

    # --- Validate policy_id ---
    if policy_id is None:
        return jsonify({"error": "'policy_id' is required"}), 400
    if not isinstance(policy_id, int):
        return jsonify({"error": "'policy_id' must be an integer"}), 400

    policy = Policy.query.get(policy_id)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404

    # --- Validate claim_number ---
    if not claim_number or not isinstance(claim_number, str) or not claim_number.strip():
        return jsonify({"error": "'claim_number' is required and must be a non-empty string"}), 400

    existing_claim = Claim.query.filter_by(claim_number=claim_number).first()
    if existing_claim:
        return jsonify({"error": "A claim with this claim_number already exists"}), 409

    # --- Validate claim_amount ---
    if claim_amount_raw is None or claim_amount_raw == "":
        return jsonify({"error": "'claim_amount' is required"}), 400
    try:
        claim_amount = Decimal(str(claim_amount_raw))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "'claim_amount' must be a valid monetary value"}), 400
    if claim_amount <= 0:
        return jsonify({"error": "'claim_amount' must be a positive monetary value"}), 400

    # --- Validate claim_date ---
    if not claim_date_raw:
        return jsonify({"error": "'claim_date' is required"}), 400
    try:
        claim_date = datetime.strptime(claim_date_raw, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date format for claim_date. Expected YYYY-MM-DD"}), 400

    # --- Validate status ---
    # New claims are restricted to PENDING regardless of what the client sends.
    # This endpoint is for FILING a claim, not processing/approving one — that
    # is a separate future workflow. Silently ignoring a client-supplied status
    # value here (rather than accepting it) prevents a caller from creating a
    # claim that is already APPROVED or SETTLED at the moment it's filed.
    if status not in VALID_CLAIM_STATUSES:
        return jsonify({
            "error": "Invalid status",
            "allowed_statuses": list(VALID_CLAIM_STATUSES)
        }), 400

    if status != DEFAULT_STATUS:
        return jsonify({
            "error": f"New claims must be filed with status '{DEFAULT_STATUS}'. "
                     f"Claim processing (approval, rejection, settlement) is handled separately."
        }), 400

    # --- Validate description ---
    if description is not None:
        if not isinstance(description, str):
            return jsonify({"error": "'description' must be a string"}), 400
        if len(description) > MAX_DESCRIPTION_LENGTH:
            return jsonify({
                "error": f"'description' cannot exceed {MAX_DESCRIPTION_LENGTH} characters"
            }), 400

    # --- Create and save ---
    try:
        new_claim = Claim(
            policy_id=policy_id,
            claim_number=claim_number,
            claim_amount=claim_amount,
            claim_date=claim_date,
            status=DEFAULT_STATUS,
            description=description
        )
        db.session.add(new_claim)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A claim with this claim_number already exists"}), 409

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while filing the claim"}), 500

    return jsonify({
        "message": "Claim filed successfully",
        "claim": new_claim.to_dict()
    }), 201



MAX_PER_PAGE = 100
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10


@claim_bp.route("", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_claims():
    page_raw = request.args.get("page", str(DEFAULT_PAGE))
    per_page_raw = request.args.get("per_page", str(DEFAULT_PER_PAGE))

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

    # Join Claim with Policy so policy_number is available without a per-row query
    query = Claim.query.join(Policy, Claim.policy_id == Policy.id).order_by(
        desc(Claim.claim_date).nullslast(),
        desc(Claim.created_at)
    )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    claims = []
    for claim in pagination.items:
        claims.append({
            "id": claim.id,
            "policy_id": claim.policy_id,
            "policy_number": claim.policy.policy_number,
            "claim_number": claim.claim_number,
            "claim_amount": str(claim.claim_amount),
            "claim_date": claim.claim_date.isoformat() if claim.claim_date else None,
            "status": claim.status,
            "description": claim.description,
            "created_at": claim.created_at.isoformat() if claim.created_at else None,
            "updated_at": claim.updated_at.isoformat() if claim.updated_at else None
        })

    return jsonify({
        "claims": claims,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200


@claim_bp.route("/<claim_id>", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_claim_by_id(claim_id):
    if not claim_id.isdigit():
        return jsonify({"error": "Invalid claim ID. Must be a positive integer"}), 400

    claim = Claim.query.get(int(claim_id))
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    return jsonify({
        "claim": {
            "id": claim.id,
            "policy_id": claim.policy_id,
            "policy_number": claim.policy.policy_number,
            "claim_number": claim.claim_number,
            "claim_amount": str(claim.claim_amount),
            "claim_date": claim.claim_date.isoformat() if claim.claim_date else None,
            "status": claim.status,
            "description": claim.description,
            "created_at": claim.created_at.isoformat() if claim.created_at else None,
            "updated_at": claim.updated_at.isoformat() if claim.updated_at else None
        }
    }), 200

ALLOWED_TRANSITIONS = {
    "PENDING": ["UNDER_REVIEW"],
    "UNDER_REVIEW": ["APPROVED", "REJECTED"],
    "APPROVED": ["SETTLED"],
    "REJECTED": [],
    "SETTLED": []
}


@claim_bp.route("/<claim_id>/status", methods=["PATCH"])
@roles_required("ADMIN", "AGENT")
def update_claim_status(claim_id):
    if not claim_id.isdigit():
        return jsonify({"error": "Invalid claim ID. Must be a positive integer"}), 400

    claim = Claim.query.get(int(claim_id))
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    requested_status = data.get("status")

    if not requested_status or not isinstance(requested_status, str) or not requested_status.strip():
        return jsonify({"error": "'status' is required"}), 400

    if requested_status not in VALID_CLAIM_STATUSES:
        return jsonify({
            "error": "Invalid status",
            "allowed_statuses": list(VALID_CLAIM_STATUSES)
        }), 400

    current_status = claim.status
    allowed_next_statuses = ALLOWED_TRANSITIONS.get(current_status, [])

    if requested_status not in allowed_next_statuses:
        return jsonify({
            "error": "Invalid claim status transition",
            "current_status": current_status,
            "requested_status": requested_status
        }), 409

    try:
        claim.status = requested_status
        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "An unexpected error occurred while updating the claim status"
        }), 500

    return jsonify({
        "message": "Claim status updated successfully",
        "claim": {
            "id": claim.id,
            "claim_number": claim.claim_number,
            "policy_id": claim.policy_id,
            "claim_amount": str(claim.claim_amount),
            "claim_date": claim.claim_date.isoformat() if claim.claim_date else None,
            "status": claim.status,
            "description": claim.description,
            "updated_at": claim.updated_at.isoformat() if claim.updated_at else None
        }
    }), 200
