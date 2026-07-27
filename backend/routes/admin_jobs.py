from flask import Blueprint, jsonify
from utils.decorators import roles_required
from services.reminder_service import run_premium_reminder_job
from services.reminder_service import run_policy_expiry_reminder_job
admin_jobs_bp = Blueprint("admin_jobs", __name__, url_prefix="/api/admin/jobs")


@admin_jobs_bp.route("/premium-reminders/run", methods=["POST"])
@roles_required("ADMIN")
def trigger_premium_reminders():
    try:
        summary = run_premium_reminder_job()
        return jsonify(summary), 200
    except Exception:
        return jsonify({"error": "An unexpected error occurred while running the reminder job"}), 500

    from services.reminder_service import run_policy_expiry_reminder_job


@admin_jobs_bp.route("/policy-expiry-reminders/run", methods=["POST"])
@roles_required("ADMIN")
def trigger_policy_expiry_reminders():
    try:
        summary = run_policy_expiry_reminder_job()
        return jsonify(summary), 200
    except Exception:
        return jsonify({"error": "An unexpected error occurred while running the policy expiry reminder job"}), 500