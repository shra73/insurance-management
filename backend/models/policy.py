from extensions import db


class Policy(db.Model):
    __tablename__ = "policies"

    id = db.Column(db.Integer, primary_key=True)
    policy_number = db.Column(db.String(50), nullable=False, unique=True)
    type = db.Column(db.String(50), nullable=False)
    premium_amount = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f"<Policy id={self.id} number={self.policy_number}>"