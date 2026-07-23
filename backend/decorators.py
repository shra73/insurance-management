from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def roles_required(*allowed_roles):
    """
    Decorator that ensures a valid JWT is present AND that the user's
    role (stored in the JWT claims) is one of the allowed roles.

    Usage:
        @roles_required("ADMIN")
        @roles_required("ADMIN", "AGENT")
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in allowed_roles:
                return jsonify({
                    "error": "Access forbidden: insufficient role permissions",
                    "required_roles": list(allowed_roles)
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator