from flask import Blueprint, request, jsonify
from utils.decorators import roles_required
from services.email_service import send_html_email

email_test_bp = Blueprint("email_test", __name__, url_prefix="/api")


@email_test_bp.route("/test-email", methods=["POST"])
@roles_required("ADMIN")
def test_email():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    recipient_email = data.get("email")

    if not recipient_email or not isinstance(recipient_email, str) or not recipient_email.strip():
        return jsonify({"error": "'email' is required"}), 400

    html_body = """
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1a2b4c;">Insurance Management Platform</h2>
        <p>This is a test email confirming that the email service is configured correctly.</p>
        <p style="color: #777; font-size: 12px;">If you were not expecting this email, you can safely ignore it.</p>
      </body>
    </html>
    """

    success, error_message = send_html_email(
        subject="Insurance Management Platform - Test Email",
        recipients=[recipient_email],
        html_body=html_body
    )

    if not success:
        return jsonify({"error": "Failed to send test email"}), 500

    return jsonify({"message": f"Test email sent successfully to {recipient_email}"}), 200