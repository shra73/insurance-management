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
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

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
        new_customer = Customer(name=name, dob=dob, phone=phone, address=address, email=email)
        db.session.add(new_customer)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A customer with this email already exists"}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while creating the customer"}), 500

    return jsonify({"message": "Customer created successfully", "customer": new_customer.to_dict()}), 201


@customer_bp.route("", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_customers():
    page_raw = request.args.get("page", str(DEFAULT_PAGE))
    per_page_raw = request.args.get("per_page", str(DEFAULT_PER_PAGE))
    search = request.args.get("search", "").strip()

    filter_name = request.args.get("name", "").strip()
    filter_email = request.args.get("email", "").strip()
    filter_phone = request.args.get("phone", "").strip()
    filter_dob_raw = request.args.get("dob", "").strip()

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
        return jsonify({"error": f"'per_page' cannot exceed {MAX_PER_PAGE}"}), 400

    filter_dob = None
    if filter_dob_raw:
        try:
            filter_dob = datetime.strptime(filter_dob_raw, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid 'dob' filter format. Expected YYYY-MM-DD"}), 400

    query = Customer.query

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Customer.name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.phone.ilike(search_pattern)
            )
        )

    if filter_name:
        query = query.filter(Customer.name.ilike(f"%{filter_name}%"))
    if filter_email:
        query = query.filter(Customer.email.ilike(f"%{filter_email}%"))
    if filter_phone:
        query = query.filter(Customer.phone.ilike(f"%{filter_phone}%"))
    if filter_dob:
        query = query.filter(Customer.dob == filter_dob)

    query = query.order_by(Customer.id.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
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

    return jsonify({"customer": customer.to_dict()}), 200


@customer_bp.route("/<customer_id>", methods=["PUT"])
@roles_required("ADMIN", "AGENT")
def update_customer(customer_id):
    if not customer_id.isdigit():
        return jsonify({"error": "Invalid customer ID. Must be a positive integer"}), 400

    customer = Customer.query.get(int(customer_id))
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    if "id" in data:
        return jsonify({"error": "Customer ID cannot be modified"}), 400

    allowed_fields = {"name", "dob", "phone", "address", "email"}
    unknown_fields = [key for key in data.keys() if key not in allowed_fields]
    if unknown_fields:
        return jsonify({"error": "Unsupported fields in request", "fields": unknown_fields}), 400

    if "dob" in data:
        try:
            new_dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format for dob. Expected YYYY-MM-DD"}), 400
    else:
        new_dob = None

    if "email" in data:
        new_email = data["email"]
        if not new_email or not EMAIL_REGEX.match(new_email):
            return jsonify({"error": "Invalid email format"}), 400
        existing_customer = Customer.query.filter(
            Customer.email == new_email, Customer.id != customer.id
        ).first()
        if existing_customer:
            return jsonify({"error": "A customer with this email already exists"}), 409
    else:
        new_email = None

    if "phone" in data:
        new_phone = data["phone"]
        if not new_phone or not PHONE_REGEX.match(new_phone):
            return jsonify({"error": "Invalid phone number format"}), 400
    else:
        new_phone = None

    if "name" in data and not data["name"]:
        return jsonify({"error": "'name' cannot be empty"}), 400

    if "address" in data and not data["address"]:
        return jsonify({"error": "'address' cannot be empty"}), 400

    try:
        if "name" in data:
            customer.name = data["name"]
        if new_dob is not None:
            customer.dob = new_dob
        if new_phone is not None:
            customer.phone = new_phone
        if "address" in data:
            customer.address = data["address"]
        if new_email is not None:
            customer.email = new_email

        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A customer with this email already exists"}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while updating the customer"}), 500

    return jsonify({"message": "Customer updated successfully", "customer": customer.to_dict()}), 200


@customer_bp.route("/<customer_id>", methods=["DELETE"])
@roles_required("ADMIN", "AGENT")
def delete_customer(customer_id):
    if not customer_id.isdigit():
        return jsonify({"error": "Invalid customer ID. Must be a positive integer"}), 400

    customer = Customer.query.get(int(customer_id))
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    try:
        db.session.delete(customer)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred while deleting the customer"}), 500

    return jsonify({"message": "Customer deleted successfully"}), 200
