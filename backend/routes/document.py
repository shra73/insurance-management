import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError
from extensions import db
from models.document import Document
from models.policy import Policy
from models.user import User
from utils.decorators import roles_required
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import desc
from pathlib import Path
from flask import send_file, current_app
from flask_jwt_extended import get_jwt_identity

document_bp = Blueprint("document", __name__, url_prefix="/api/documents")

VALID_DOCUMENT_TYPES = ("POLICY_DOCUMENT", "ID_PROOF", "INSURANCE_CERTIFICATE", "CLAIM_DOCUMENT", "OTHER")


def _get_extension(filename):
    if "." not in filename:
        return None
    return filename.rsplit(".", 1)[1].lower()


@document_bp.route("", methods=["POST"])
@roles_required("ADMIN", "AGENT")
def upload_document():
    # --- 1. Validate policy_id ---
    policy_id_raw = request.form.get("policy_id")
    if not policy_id_raw:
        return jsonify({"error": "'policy_id' is required"}), 400
    if not policy_id_raw.isdigit():
        return jsonify({"error": "'policy_id' must be a valid integer"}), 400
    policy_id = int(policy_id_raw)

    policy = Policy.query.get(policy_id)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404

    # --- 2. Validate document_type ---
    document_type = request.form.get("document_type")
    if not document_type:
        return jsonify({"error": "'document_type' is required"}), 400
    if document_type not in VALID_DOCUMENT_TYPES:
        return jsonify({
            "error": "Invalid document_type",
            "allowed_types": list(VALID_DOCUMENT_TYPES)
        }), 400

    # --- 3. Validate file presence ---
    if "file" not in request.files:
        return jsonify({"error": "'file' is required"}), 400

    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # --- 4. Validate extension ---
    original_filename = uploaded_file.filename
    extension = _get_extension(original_filename)
    allowed_extensions = current_app.config["ALLOWED_DOCUMENT_EXTENSIONS"]

    if not extension or extension not in allowed_extensions:
        return jsonify({
            "error": "Unsupported file extension",
            "allowed_extensions": sorted(allowed_extensions)
        }), 400

    # --- 5. Basic MIME type cross-check ---
    # Note: this is a reasonable server-side sanity check, not a security
    # guarantee. A determined attacker can spoof both the file extension and
    # the browser-supplied Content-Type of a file. True content verification
    # would require inspecting the file's actual byte signature (magic
    # numbers) or a dedicated content-scanning library/service, which is out
    # of scope for this step. Production deployments should also run
    # uploaded files through a malware/antivirus scanning service before
    # they are considered safe to serve back to users.
    expected_mime = current_app.config["ALLOWED_MIME_TYPES"].get(extension)
    if expected_mime and uploaded_file.mimetype != expected_mime:
        return jsonify({
            "error": "File content type does not match its extension",
            "expected": expected_mime,
            "received": uploaded_file.mimetype
        }), 400

    # --- 6. Get authenticated user (uploaded_by) ---
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "Authenticated user not found"}), 401

    # --- 7. Generate a secure, unique stored filename ---
    # secure_filename() strips path separators, ".." sequences, and other
    # unsafe characters from the ORIGINAL name before we even use it for
    # display purposes. The name actually used for storage is built fresh
    # from a UUID, completely independent of anything the client sent, so
    # there is no way for client input to influence the resulting path.
    safe_original_name = secure_filename(original_filename)
    stored_file_name = f"{uuid.uuid4().hex}_{safe_original_name}"

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    # Path is built entirely server-side from a fixed base directory plus a
    # server-generated filename — the client can never supply file_path,
    # and nothing derived from client input is used to construct it beyond
    # the sanitized display name embedded in the UUID-prefixed filename.
    absolute_file_path = os.path.join(upload_folder, stored_file_name)

    # Defense in depth: confirm the final resolved path is still inside the
    # configured upload folder before ever writing to disk.
    if not os.path.abspath(absolute_file_path).startswith(os.path.abspath(upload_folder)):
        return jsonify({"error": "Invalid file path"}), 400

    # --- 8. Save the physical file first ---
    try:
        uploaded_file.save(absolute_file_path)
    except Exception:
        return jsonify({"error": "Failed to save the uploaded file"}), 500

    # Calculate size from the actual saved file on disk, never trusting
    # any client-supplied size value.
    try:
        file_size = os.path.getsize(absolute_file_path)
    except OSError:
        # Clean up if we can't even stat the file we just wrote
        if os.path.exists(absolute_file_path):
            os.remove(absolute_file_path)
        return jsonify({"error": "Failed to process the uploaded file"}), 500

    if file_size <= 0:
        os.remove(absolute_file_path)
        return jsonify({"error": "Uploaded file is empty"}), 400

    # Store only the relative path in the database, not the absolute
    # server filesystem path.
    relative_file_path = os.path.join("uploads", "documents", stored_file_name)

    # --- 9. Create the database record; roll back + delete file on failure ---
    try:
        new_document = Document(
            policy_id=policy_id,
            original_file_name=original_filename,
            stored_file_name=stored_file_name,
            file_path=relative_file_path,
            file_type=extension,
            file_size=file_size,
            document_type=document_type,
            uploaded_by=user.id
        )
        db.session.add(new_document)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        if os.path.exists(absolute_file_path):
            os.remove(absolute_file_path)
        return jsonify({"error": "A document with this stored filename already exists"}), 409

    except Exception:
        db.session.rollback()
        # Never leave an orphaned file on disk if the DB record failed.
        if os.path.exists(absolute_file_path):
            os.remove(absolute_file_path)
        return jsonify({"error": "An unexpected error occurred while saving the document"}), 500

    return jsonify({
        "message": "Document uploaded successfully",
        "document": {
            "id": new_document.id,
            "policy_id": new_document.policy_id,
            "original_file_name": new_document.original_file_name,
            "stored_file_name": new_document.stored_file_name,
            "file_type": new_document.file_type,
            "file_size": new_document.file_size,
            "document_type": new_document.document_type,
            "uploaded_by": new_document.uploaded_by,
            "created_at": new_document.created_at.isoformat() if new_document.created_at else None
        }
    }), 201

from sqlalchemy import desc

MAX_PER_PAGE = 100
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10


@document_bp.route("", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_documents():
    # NOTE ON CUSTOMER ACCESS:
    # Per the same architectural gap already flagged in Claims and Document
    # Upload: there is still no link between a User's JWT identity and a
    # Customer/Policy record anywhere in this codebase. Safely scoping a
    # CUSTOMER-role request to "only documents belonging to policies owned
    # by that customer" would require querying Document -> Policy -> Customer
    # -> User, but no relationship connects Customer to User currently exists.
    # Per your explicit instruction not to invent a new authentication
    # mechanism, this endpoint remains restricted to ADMIN and AGENT until
    # that identity link is established in a future step.

    page_raw = request.args.get("page", str(DEFAULT_PAGE))
    per_page_raw = request.args.get("per_page", str(DEFAULT_PER_PAGE))
    search = request.args.get("search", "").strip()
    filter_policy_id_raw = request.args.get("policy_id", "").strip()
    filter_document_type = request.args.get("document_type", "").strip()

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

    filter_policy_id = None
    if filter_policy_id_raw:
        if not filter_policy_id_raw.isdigit():
            return jsonify({"error": "Invalid 'policy_id' filter. Must be a positive integer"}), 400
        filter_policy_id = int(filter_policy_id_raw)

    if filter_document_type and filter_document_type not in VALID_DOCUMENT_TYPES:
        return jsonify({
            "error": "Invalid 'document_type' filter",
            "allowed_types": list(VALID_DOCUMENT_TYPES)
        }), 400

    query = Document.query

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Document.original_file_name.ilike(search_pattern),
                Document.stored_file_name.ilike(search_pattern)
            )
        )

    if filter_policy_id is not None:
        query = query.filter(Document.policy_id == filter_policy_id)
    if filter_document_type:
        query = query.filter(Document.document_type == filter_document_type)

    query = query.order_by(desc(Document.created_at), desc(Document.id))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    documents = [
        {
            "id": d.id,
            "policy_id": d.policy_id,
            "original_file_name": d.original_file_name,
            "stored_file_name": d.stored_file_name,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "document_type": d.document_type,
            "uploaded_by": d.uploaded_by,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "updated_at": d.updated_at.isoformat() if d.updated_at else None
        }
        for d in pagination.items
    ]

    return jsonify({
        "documents": documents,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200


@document_bp.route("/<document_id>", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def get_document_by_id(document_id):
    # Same CUSTOMER-access note as get_documents above applies here.
    # Since ownership cannot currently be verified (no User<->Customer link),
    # this stays restricted to ADMIN/AGENT to avoid any risk of IDOR — it
    # would be unsafe to allow broader access without a real ownership check.

    if not document_id.isdigit():
        return jsonify({"error": "Invalid document ID. Must be a positive integer"}), 400

    document = Document.query.get(int(document_id))
    if not document:
        return jsonify({"error": "Document not found"}), 404

    return jsonify({
        "document": {
            "id": document.id,
            "policy_id": document.policy_id,
            "original_file_name": document.original_file_name,
            "stored_file_name": document.stored_file_name,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "document_type": document.document_type,
            "uploaded_by": document.uploaded_by,
            "created_at": document.created_at.isoformat() if document.created_at else None,
            "updated_at": document.updated_at.isoformat() if document.updated_at else None
        }
    }), 200



MIME_TYPES_BY_EXTENSION = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@document_bp.route("/<document_id>/download", methods=["GET"])
@roles_required("ADMIN", "AGENT")
def download_document(document_id):
    # NOTE ON CUSTOMER ACCESS:
    # The required authorization chain for a CUSTOMER is:
    #   JWT -> User -> Customer -> Policy ownership -> Document
    # This chain cannot currently be completed safely: there is still no
    # relationship connecting a User (JWT identity) to a Customer record
    # anywhere in this codebase. This exact gap has been flagged consistently
    # across every prior module (Claims, Document Upload, Document List).
    # Per the explicit instruction not to invent a new customer ownership
    # system, and because IDOR prevention takes priority over feature
    # completeness, this endpoint remains restricted to ADMIN and AGENT
    # until that identity link is established in a future step.

    if not document_id.isdigit():
        return jsonify({"error": "Invalid document ID. Must be a positive integer"}), 400

    document = Document.query.get(int(document_id))
    if not document:
        return jsonify({"error": "Document not found"}), 404

    # --- Safe path resolution ---
    # The filesystem location is derived ENTIRELY from trusted server-side
    # data: the configured upload directory (from app config) plus the
    # stored_file_name already recorded in the database at upload time.
    # Nothing from the request (query params, headers, body) is ever used
    # to build this path — the client has no ability to influence it.
    upload_root = Path(_current_app.config["UPLOAD_FOLDER"]).resolve()
    candidate_path = (upload_root / document.stored_file_name).resolve()

    # Defense in depth: even though stored_file_name is trusted (it was
    # generated server-side at upload time, never taken from client input),
    # this explicit containment check guarantees the resolved path can never
    # fall outside the configured upload directory, regardless of how it
    # was produced.
    try:
        is_contained = candidate_path.is_relative_to(upload_root)
    except AttributeError:
        # is_relative_to() requires Python 3.9+; fall back to a string-prefix
        # check for older interpreters while keeping the same guarantee.
        is_contained = str(candidate_path).startswith(str(upload_root))

    if not is_contained:
        current_app.logger.warning(
            f"Blocked download attempt outside upload directory. "
            f"document_id={document.id}, requested_by_user_id={get_jwt_identity()}"
        )
        return jsonify({"error": "Document file not found"}), 404

    # --- File existence check ---
    if not candidate_path.exists() or not candidate_path.is_file():
        current_app.logger.warning(
            f"Document record exists but physical file is missing. "
            f"document_id={document.id}, requested_by_user_id={get_jwt_identity()}"
        )
        return jsonify({"error": "Document file not found"}), 404

    # --- Determine a safe MIME type from the trusted file_type column ---
    # (never trust a client-supplied MIME type; there isn't one in this
    # request anyway, since the client supplies no file information at all)
    mimetype = MIME_TYPES_BY_EXTENSION.get(document.file_type, "application/octet-stream")

    try:
        return send_file(
            candidate_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=document.original_file_name
        )
    except Exception:
        current_app.logger.error(
            f"Unexpected error serving document file. document_id={document.id}"
        )
        return jsonify({"error": "An unexpected error occurred while retrieving the document"}), 500

@document_bp.route("/<document_id>", methods=["DELETE"])
@roles_required("ADMIN", "AGENT")
def delete_document(document_id):
    # NOTE ON CUSTOMER ACCESS:
    # Same architectural gap flagged consistently across every Document and
    # Claims endpoint in this project: safely verifying that a document
    # belongs to "the authenticated customer's own policy" requires a
    # JWT -> User -> Customer -> Policy -> Document chain, but no
    # relationship links Customer to User anywhere in this codebase. Per
    # the explicit instruction to reuse existing ownership verification
    # (not invent a new one) and deny access otherwise, this endpoint
    # remains restricted to ADMIN and AGENT until that identity link
    # exists in a future step.

    if not document_id.isdigit():
        return jsonify({"error": "Invalid document ID. Must be a positive integer"}), 400

    document = Document.query.get(int(document_id))
    if not document:
        return jsonify({"error": "Document not found"}), 404

    # --- 1 & 2: Resolve safe file path, verify containment ---
    upload_root = Path(current_app.config["UPLOAD_FOLDER"]).resolve()
    candidate_path = (upload_root / document.stored_file_name).resolve()

    try:
        is_contained = candidate_path.is_relative_to(upload_root)
    except AttributeError:
        is_contained = str(candidate_path).startswith(str(upload_root))

    if not is_contained:
        current_app.logger.warning(
            f"Blocked delete attempt with out-of-bounds path. "
            f"document_id={document.id}, requested_by_user_id={get_jwt_identity()}"
        )
        return jsonify({"error": "Document not found"}), 404

    # --- 3: Delete the physical file if it exists ---
    # Track whether the file existed at the start, purely for the
    # informational response message below — this does not change the
    # deletion logic itself.
    file_was_missing = not (candidate_path.exists() and candidate_path.is_file())

    if not file_was_missing:
        try:
            candidate_path.unlink()
        except OSError:
            current_app.logger.error(
                f"Failed to remove physical file during document delete. "
                f"document_id={document.id}"
            )
            return jsonify({
                "error": "An unexpected error occurred while deleting the document"
            }), 500

    # --- 4 & 5: Delete the Document row, commit ---
    try:
        db.session.delete(document)
        db.session.commit()

    except Exception:
        db.session.rollback()
        # The physical file may have already been removed above (step 3
        # happens before this point). If the database commit now fails,
        # we're left with a file gone but the row still present. This is
        # logged clearly so it can be investigated/cleaned up manually,
        # rather than silently hidden — but no internal exception detail
        # is exposed to the client.
        current_app.logger.error(
            f"Database commit failed after physical file removal during "
            f"document delete. document_id={document.id}, "
            f"physical_file_removed={not file_was_missing}"
        )
        return jsonify({
            "error": "An unexpected error occurred while deleting the document"
        }), 500

    if file_was_missing:
        return jsonify({
            "message": "Document deleted successfully. "
                       "Note: the physical file was already missing from storage."
        }), 200

    return jsonify({
        "message": "Document deleted successfully"
    }), 200
    