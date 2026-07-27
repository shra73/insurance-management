from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token
from extensions import db
from models.user import User
from services.email_service import send_welcome_email
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

VALID_ROLES = ("ADMIN", "AGENT", "CUSTOMER")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    missing_fields = [
        field for field, value in
        [("name", name), ("email", email), ("password", password), ("role", role)]
        if not value
    ]
    if missing_fields:
        return jsonify({
            "error": "Missing required fields",
            "fields": missing_fields
        }), 400

    if role not in VALID_ROLES:
        return jsonify({
            "error": "Invalid role",
            "allowed_roles": list(VALID_ROLES)
        }), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email is already registered"}), 409

    try:
        new_user = User(name=name, email=email, role=role)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email is already registered"}), 409

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while registering the user"}), 500

    # Registration has already succeeded and been committed at this point.
    # Sending the welcome email is a best-effort side effect: if it fails
    # for any reason (SMTP down, bad credentials, network issue), the
    # user's account still exists and the registration response below is
    # still returned normally. The failure is only logged, never exposed
    # to the client, and never causes a rollback of the already-committed
    # user record.
    try:
        success, error_message = send_welcome_email(new_user.email, new_user.name)
        if not success:
            logger.error(
                f"Welcome email failed to send after successful registration. "
                f"user_id={new_user.id}, reason={error_message}"
            )
    except Exception:
        logger.error(
            f"Unexpected error while attempting to send welcome email. "
            f"user_id={new_user.id}"
        )

    return jsonify({
        "message": "User registered successfully",
        "user": new_user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    email = data.get("email")
    password = data.get("password")

    missing_fields = [
        field for field, value in [("email", email), ("password", password)]
        if not value
    ]
    if missing_fields:
        return jsonify({
            "error": "Missing required fields",
            "fields": missing_fields
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200