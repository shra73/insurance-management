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