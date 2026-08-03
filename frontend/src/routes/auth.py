from flask_jwt_extended import jwt_required, get_jwt_identity


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # NOTE: the User model currently has no 'phone' column at all -- only
    # id, name, email, password, role exist. Only 'name' can genuinely be
    # updated here. Email is intentionally excluded (kept read-only, per
    # spec) since changing it would need re-verification logic that
    # doesn't exist yet, and role/password have their own dedicated
    # mechanisms (registration and the change-password endpoint below).
    allowed_fields = {"name"}
    disallowed_fields = [key for key in data.keys() if key not in allowed_fields]
    if disallowed_fields:
        return jsonify({
            "error": "These fields cannot be modified through this endpoint",
            "fields": disallowed_fields
        }), 400

    new_name = data.get("name")
    if not new_name or not isinstance(new_name, str) or not new_name.strip():
        return jsonify({"error": "'name' is required and must be a non-empty string"}), 400

    try:
        user.name = new_name.strip()
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while updating your profile"}), 500

    return jsonify({
        "message": "Profile updated successfully",
        "user": user.to_dict()
    }), 200


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    missing_fields = [
        field for field, value in
        [("current_password", current_password), ("new_password", new_password)]
        if not value
    ]
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    if current_password == new_password:
        return jsonify({"error": "New password must be different from the current password"}), 400

    try:
        user.set_password(new_password)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while changing your password"}), 500

    return jsonify({"message": "Password changed successfully"}), 200