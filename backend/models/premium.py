from datetime import datetime
from extensions import db


class PremiumPayment(db.Model):
    __tablename__ = "premium_payments"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(
        db.Integer,
        db.ForeignKey("policies.id", ondelete="RESTRICT"),
        nullable=False
    )
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_status = db.Column(db.String(20), nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    payment_reference = db.Column(db.String(100), nullable=True, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    policy = db.relationship("Policy", back_populates="premium_payments")

    __table_args__ = (
        db.CheckConstraint("amount > 0", name="check_premium_amount_positive"),
        db.CheckConstraint(
            "payment_status IN ('PENDING', 'PAID', 'FAILED', 'PARTIAL')",
            name="check_premium_status_valid"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "amount": str(self.amount) if self.amount is not None else None,
            "payment_status": self.payment_status,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "payment_reference": self.payment_reference,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<PremiumPayment id={self.id} policy_id={self.policy_id} status={self.payment_status}>"
    