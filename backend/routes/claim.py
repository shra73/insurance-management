import logging
from services.email_service import send_claim_status_email
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
logger = logging.getLogger(__name__)
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

    old_status = claim.status
    allowed_next_statuses = ALLOWED_TRANSITIONS.get(old_status, [])

    if requested_status not in allowed_next_statuses:
        return jsonify({
            "error": "Invalid claim status transition",
            "current_status": old_status,
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

    # Claim status has already been changed and committed at this point.
    # Per the existing ALLOWED_TRANSITIONS rules, a claim can only reach
    # this point if requested_status was a genuinely different, permitted
    # next state from old_status (no status maps to itself in the
    # transition table) — so old_status != claim.status is already
    # guaranteed here. The explicit comparison below is kept anyway as a
    # clear, self-documenting safety check, so this code doesn't silently
    # rely on that guarantee holding if ALLOWED_TRANSITIONS is ever
    # modified in the future.
    new_status = claim.status
    if old_status != new_status:
        try:
            policy = claim.policy
            customer = policy.customer

            success, error_message = send_claim_status_email(
                customer.email, customer.name, claim, policy, old_status, new_status
            )
            if not success:
                logger.error(
                    f"Claim status update email failed to send. "
                    f"claim_id={claim.id}, old_status={old_status}, "
                    f"new_status={new_status}, reason={error_message}"
                )
        except Exception:
            logger.error(
                f"Unexpected error while attempting to send claim status update email. "
                f"claim_id={claim.id}, old_status={old_status}, new_status={new_status}"
            )

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


UPDATABLE_STATUSES = ("PENDING", "UNDER_REVIEW")
DELETABLE_STATUSES = ("PENDING",)


@claim_bp.route("/<claim_id>", methods=["PATCH"])
@roles_required("ADMIN", "AGENT")
def update_claim(claim_id):
    if not claim_id.isdigit():
        return jsonify({"error": "Invalid claim ID. Must be a positive integer"}), 400

    claim = Claim.query.get(int(claim_id))
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    # Only PENDING/UNDER_REVIEW claims may have their details edited.
    # Once a claim has been decided (APPROVED/REJECTED) or paid out (SETTLED),
    # its record must remain stable for audit/history purposes.
    if claim.status not in UPDATABLE_STATUSES:
        return jsonify({
            "error": "Claim cannot be modified in its current status",
            "status": claim.status
        }), 409

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    allowed_fields = {"claim_amount", "claim_date", "description"}
    disallowed_fields = [key for key in data.keys() if key not in allowed_fields]
    if disallowed_fields:
        return jsonify({
            "error": "These fields cannot be modified through this endpoint",
            "fields": disallowed_fields
        }), 400

    if not data:
        return jsonify({"error": "No valid fields provided to update"}), 400

    # --- Validate claim_amount if provided ---
    new_claim_amount = None
    if "claim_amount" in data:
        try:
            new_claim_amount = Decimal(str(data["claim_amount"]))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "'claim_amount' must be a valid monetary value"}), 400
        if new_claim_amount <= 0:
            return jsonify({"error": "'claim_amount' must be a positive monetary value"}), 400

    # --- Validate claim_date if provided ---
    new_claim_date = None
    if "claim_date" in data:
        try:
            new_claim_date = datetime.strptime(data["claim_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format for claim_date. Expected YYYY-MM-DD"}), 400

    # --- Validate description if provided ---
    new_description = None
    description_provided = "description" in data
    if description_provided:
        new_description = data["description"]
        if new_description is not None and not isinstance(new_description, str):
            return jsonify({"error": "'description' must be a string"}), 400
        if new_description is not None and len(new_description) > MAX_DESCRIPTION_LENGTH:
            return jsonify({
                "error": f"'description' cannot exceed {MAX_DESCRIPTION_LENGTH} characters"
            }), 400

    # --- Apply updates ---
    try:
        if new_claim_amount is not None:
            claim.claim_amount = new_claim_amount
        if new_claim_date is not None:
            claim.claim_date = new_claim_date
        if description_provided:
            claim.description = new_description

        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while updating the claim"}), 500

    return jsonify({
        "message": "Claim updated successfully",
        "claim": {
            "id": claim.id,
            "policy_id": claim.policy_id,
            "claim_number": claim.claim_number,
            "claim_amount": str(claim.claim_amount),
            "claim_date": claim.claim_date.isoformat() if claim.claim_date else None,
            "status": claim.status,
            "description": claim.description,
            "updated_at": claim.updated_at.isoformat() if claim.updated_at else None
        }
    }), 200


@claim_bp.route("/<claim_id>", methods=["DELETE"])
@roles_required("ADMIN", "AGENT")
def delete_claim(claim_id):
    if not claim_id.isdigit():
        return jsonify({"error": "Invalid claim ID. Must be a positive integer"}), 400

    claim = Claim.query.get(int(claim_id))
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    # Only a claim that hasn't entered processing yet (PENDING) may be deleted.
    # Once a claim has been reviewed, decided, or settled, it must remain
    # available for audit/history rather than being erasable.
    if claim.status not in DELETABLE_STATUSES:
        return jsonify({
            "error": "Claim cannot be deleted in its current status",
            "status": claim.status
        }), 409

    try:
        db.session.delete(claim)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while deleting the claim"}), 500

    return jsonify({"message": "Claim deleted successfully"}), 200
