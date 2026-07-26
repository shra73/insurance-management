from datetime import datetime
from extensions import db


class Policy(db.Model):
    __tablename__ = "policies"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False
    )
    policy_number = db.Column(db.String(50), nullable=False, unique=True)
    type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    premium_amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    customer = db.relationship("Customer", back_populates="policies")
    premium_payments = db.relationship("PremiumPayment", back_populates="policy")
    claims = db.relationship("Claim", back_populates="policy")

    __table_args__ = (
        db.CheckConstraint("end_date > start_date", name="check_policy_end_after_start"),
        db.CheckConstraint("premium_amount > 0", name="check_policy_premium_positive"),
        db.CheckConstraint(
            "status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING')",
            name="check_policy_status_valid"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "policy_number": self.policy_number,
            "type": self.type,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "premium_amount": str(self.premium_amount) if self.premium_amount is not None else None,
            "status": self.status
        }

    def __repr__(self):
        return f"<Policy id={self.id} number={self.policy_number} customer_id={self.customer_id}>"
    
    