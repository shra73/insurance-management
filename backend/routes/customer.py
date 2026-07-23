import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.customer import Customer
from utils.decorators import roles_required

customer_bp = Blueprint("customer", __name__, url_prefix="/api/customers")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_REGEX = re.compile(r"^\+?\d{7,15}$")

MAX_PER_PAGE = 100
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10


@customer_bp.route("", methods=["POST"])
@roles_required("ADMIN", "AGENT")
def create_customer():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    name = data.get("name")
    dob_raw = data.get("dob")
    phone = data.get("phone")
    address = data.get("address")
    email = data.get("email")

    missing_fields = [
        field for field, value in
        [("name", name), ("dob", dob_raw), ("phone", phone), ("address", address), ("email", email)]
        if not value
    ]
    if missing_fields:
        return jsonify({
            "error": "Missing required fields",
            "fields": missing_fields
        }), 400

    try:
        dob = datetime.strptime(dob_raw, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format for dob. Expected YYYY-MM-DD"}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not PHONE_REGEX.match(phone):
        return jsonify({"error": "Invalid phone number format"}), 400

    existing_customer = Customer.query.filter_by(email=email).first()
    if existing_customer:
        return jsonify({"error": "A customer with this email already exists"}), 409

    try:
        new_customer = Customer(
            name=name,
            dob=dob,
            phone=phone,
            address=address,
            email=email
        )

        db.session.add(new_customer)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A customer with this email already exists"}), 409

    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while creating the customer"}), 500

    return jsonify({
        "message": "Customer created successfully",
        "customer": new_customer.to_dict()
    }), 201


@customer_bp.route("", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_customers():
    page_raw = request.args.get("page", str(DEFAULT_PAGE))
    per_page_raw = request.args.get("per_page", str(DEFAULT_PER_PAGE))

    try:
        page = int(page_raw)
        if page < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'page' parameter. Must be a positive integer"}), 400

    try:
        per_page = int(per_page_raw)
        if per_page < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'per_page' parameter. Must be a positive integer"}), 400

    if per_page > MAX_PER_PAGE:
        return jsonify({
            "error": f"'per_page' cannot exceed {MAX_PER_PAGE}"
        }), 400

    pagination = Customer.query.order_by(Customer.id.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    customers = [customer.to_dict() for customer in pagination.items]

    return jsonify({
        "customers": customers,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200


@customer_bp.route("/<customer_id>", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_customer_by_id(customer_id):
    if not customer_id.isdigit():
        return jsonify({"error": "Invalid customer ID. Must be a positive integer"}), 400

    customer = Customer.query.get(int(customer_id))

    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    return jsonify({
        "customer": customer.to_dict()
    }), 200
