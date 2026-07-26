from datetime import datetime
from extensions import db


class Claim(db.Model):
    __tablename__ = "claims"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(
        db.Integer,
        db.ForeignKey("policies.id", ondelete="RESTRICT"),
        nullable=False
    )
    claim_number = db.Column(db.String(50), nullable=False, unique=True)
    claim_amount = db.Column(db.Numeric(12, 2), nullable=False)
    claim_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    policy = db.relationship("Policy", back_populates="claims")

    __table_args__ = (
        db.CheckConstraint("claim_amount > 0", name="check_claim_amount_positive"),
        db.CheckConstraint(
            "status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED')",
            name="check_claim_status_valid"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "claim_number": self.claim_number,
            "claim_amount": str(self.claim_amount) if self.claim_amount is not None else None,
            "claim_date": self.claim_date.isoformat() if self.claim_date else None,
            "status": self.status,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<Claim id={self.id} number={self.claim_number} policy_id={self.policy_id}>"
    