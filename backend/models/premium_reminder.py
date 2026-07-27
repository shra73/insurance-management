from datetime import datetime
from extensions import db


class PremiumReminder(db.Model):
    __tablename__ = "premium_reminders"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(
        db.Integer,
        db.ForeignKey("policies.id", ondelete="RESTRICT"),
        nullable=False
    )
    reminder_type = db.Column(db.String(30), nullable=False, default="PREMIUM_DUE")
    due_date = db.Column(db.Date, nullable=False)
    sent_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    policy = db.relationship("Policy")

    __table_args__ = (
        # This is the core duplicate-prevention mechanism: the database
        # itself refuses a second row for the same (policy_id, due_date,
        # reminder_type) combination, so even if the scheduled job runs
        # twice concurrently, only one reminder can ever be recorded as
        # sent for a given policy + due date + reminder type.
        db.UniqueConstraint(
            "policy_id", "due_date", "reminder_type",
            name="uq_premium_reminder_policy_duedate_type"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "reminder_type": self.reminder_type,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None
        }