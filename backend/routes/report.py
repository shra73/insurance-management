from flask import Blueprint, send_file, jsonify
from models.customer import Customer
from models.policy import Policy
from models.premium import PremiumPayment
from models.claim import Claim
from utils.decorators import roles_required
from utils.report_helpers import build_pdf_report, build_excel_report

report_bp = Blueprint("report", __name__, url_prefix="/api/reports")


# ============================================================
# CUSTOMERS
# ============================================================

@report_bp.route("/customers/pdf", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def customer_report_pdf():
    try:
        customers = Customer.query.order_by(Customer.name.asc()).all()
        headers = ["ID", "Customer Name", "Email", "Phone", "Address", "DOB"]
        rows = [
            [str(c.id), c.name, c.email, c.phone, c.address,
             c.dob.isoformat() if c.dob else ""]
            for c in customers
        ]
        col_widths = [1.5, 3.5, 4.5, 2.8, 4, 2.2]

        buffer = build_pdf_report("Customer Report", headers, rows, "Total Customers", col_widths)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True,
                          download_name="customer_report.pdf")
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the customer report"}), 500


@report_bp.route("/customers/excel", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def customer_report_excel():
    try:
        customers = Customer.query.order_by(Customer.name.asc()).all()
        headers = ["ID", "Customer Name", "Email", "Phone", "Address", "Date Of Birth", "Created At"]
        rows = [
            [c.id, c.name, c.email, c.phone, c.address,
             c.dob.isoformat() if c.dob else "",
             c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else ""]
            for c in customers
        ]

        buffer = build_excel_report("Customers", headers, rows)
        return send_file(
            buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="customer_report.xlsx"
        )
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the customer Excel report"}), 500


# ============================================================
# POLICIES
# ============================================================

def _fetch_policy_rows():
    # Join with Customer so we can display the customer's name without a
    # separate query per row.
    policies = Policy.query.join(Customer, Policy.customer_id == Customer.id) \
        .order_by(Policy.id.asc()).all()

    rows = []
    for p in policies:
        rows.append([
            p.policy_number,
            p.customer.name,
            p.type,
            str(p.premium_amount),
            p.start_date.isoformat() if p.start_date else "",
            p.end_date.isoformat() if p.end_date else "",
            p.status
        ])
    return rows


@report_bp.route("/policies/pdf", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def policy_report_pdf():
    try:
        headers = ["Policy Number", "Customer", "Policy Type", "Premium Amount",
                   "Start Date", "End Date", "Status"]
        rows = _fetch_policy_rows()
        col_widths = [2.8, 3.2, 2.6, 2.6, 2.2, 2.2, 2.2]

        buffer = build_pdf_report("Policy Report", headers, rows, "Total Policies", col_widths)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True,
                          download_name="policy_report.pdf")
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the policy report"}), 500


@report_bp.route("/policies/excel", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def policy_report_excel():
    try:
        headers = ["Policy Number", "Customer", "Policy Type", "Premium Amount",
                   "Start Date", "End Date", "Status"]
        rows = _fetch_policy_rows()

        buffer = build_excel_report("Policies", headers, rows)
        return send_file(
            buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="policy_report.xlsx"
        )
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the policy Excel report"}), 500


# ============================================================
# PREMIUMS
# ============================================================

def _fetch_premium_rows():
    # Join through Policy to reach Customer as well, in one query.
    payments = PremiumPayment.query \
        .join(Policy, PremiumPayment.policy_id == Policy.id) \
        .join(Customer, Policy.customer_id == Customer.id) \
        .order_by(PremiumPayment.id.asc()).all()

    rows = []
    for payment in payments:
        rows.append([
            str(payment.id),
            payment.policy.policy_number,
            payment.policy.customer.name,
            str(payment.amount),
            payment.payment_date.isoformat() if payment.payment_date else "",
            # NOTE: the PremiumPayment model has no "payment_method" field
            # (it was not part of the original PremiumPayment model spec —
            # only payment_reference exists). Rather than inventing a new
            # database column silently, payment_reference is shown here in
            # its place. See explanation below the code for how to add a
            # real payment_method field if this is needed going forward.
            payment.payment_reference or "N/A",
            payment.payment_status
        ])
    return rows


@report_bp.route("/premiums/pdf", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def premium_report_pdf():
    try:
        headers = ["Payment ID", "Policy Number", "Customer", "Amount Paid",
                   "Payment Date", "Payment Reference", "Status"]
        rows = _fetch_premium_rows()
        col_widths = [2, 2.6, 3, 2.4, 2.2, 2.8, 2]

        buffer = build_pdf_report("Premium Report", headers, rows, "Total Premium Payments", col_widths)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True,
                          download_name="premium_report.pdf")
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the premium report"}), 500


@report_bp.route("/premiums/excel", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def premium_report_excel():
    try:
        headers = ["Payment ID", "Policy Number", "Customer", "Amount Paid",
                   "Payment Date", "Payment Reference", "Status"]
        rows = _fetch_premium_rows()

        buffer = build_excel_report("Premiums", headers, rows)
        return send_file(
            buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="premium_report.xlsx"
        )
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the premium Excel report"}), 500


# ============================================================
# CLAIMS
# ============================================================

def _fetch_claim_rows():
    claims = Claim.query \
        .join(Policy, Claim.policy_id == Policy.id) \
        .join(Customer, Policy.customer_id == Customer.id) \
        .order_by(Claim.id.asc()).all()

    rows = []
    for claim in claims:
        rows.append([
            claim.claim_number,
            claim.policy.policy_number,
            claim.policy.customer.name,
            str(claim.claim_amount),
            claim.status,
            claim.claim_date.isoformat() if claim.claim_date else ""
        ])
    return rows


@report_bp.route("/claims/pdf", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def claim_report_pdf():
    try:
        headers = ["Claim Number", "Policy Number", "Customer", "Claim Amount",
                   "Claim Status", "Filed Date"]
        rows = _fetch_claim_rows()
        col_widths = [2.6, 2.6, 3, 2.4, 2.4, 2.2]

        buffer = build_pdf_report("Claims Report", headers, rows, "Total Claims", col_widths)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True,
                          download_name="claim_report.pdf")
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the claims report"}), 500


@report_bp.route("/claims/excel", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def claim_report_excel():
    try:
        headers = ["Claim Number", "Policy Number", "Customer", "Claim Amount",
                   "Claim Status", "Filed Date"]
        rows = _fetch_claim_rows()

        buffer = build_excel_report("Claims", headers, rows)
        return send_file(
            buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="claim_report.xlsx"
        )
    except Exception:
        return jsonify({"error": "An unexpected error occurred while generating the claims Excel report"}), 500
    