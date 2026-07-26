from datetime import datetime
from extensions import db


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(
        db.Integer,
        db.ForeignKey("policies.id", ondelete="RESTRICT"),
        nullable=False
    )
    original_file_name = db.Column(db.String(255), nullable=False)
    stored_file_name = db.Column(db.String(255), nullable=False, unique=True)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(20), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    document_type = db.Column(db.String(30), nullable=False)
    uploaded_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    policy = db.relationship("Policy", back_populates="documents")
    uploader = db.relationship("User", back_populates="documents")

    __table_args__ = (
        db.CheckConstraint("file_size > 0", name="check_document_file_size_positive"),
        db.CheckConstraint(
            "document_type IN ('POLICY_DOCUMENT', 'ID_PROOF', 'INSURANCE_CERTIFICATE', 'CLAIM_DOCUMENT', 'OTHER')",
            name="check_document_type_valid"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "original_file_name": self.original_file_name,
            "stored_file_name": self.stored_file_name,
            "file_path": self.file_path,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "document_type": self.document_type,
            "uploaded_by": self.uploaded_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<Document id={self.id} stored_file_name={self.stored_file_name} policy_id={self.policy_id}>"
    