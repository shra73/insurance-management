from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.user import User

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

    # 1. Required field validation
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

    # 2. Role validation
    if role not in VALID_ROLES:
        return jsonify({
            "error": "Invalid role",
            "allowed_roles": list(VALID_ROLES)
        }), 400

    # 3. Duplicate email check (pre-check for a clean error message)
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email is already registered"}), 409

    # 4. Create and save the user
    try:
        new_user = User(name=name, email=email, role=role)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

    except IntegrityError:
        # Safety net in case of a race condition on the unique email constraint
        db.session.rollback()
        return jsonify({"error": "Email is already registered"}), 409

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while registering the user"}), 500

    return jsonify({
        "message": "User registered successfully",
        "user": new_user.to_dict()
    }), 201