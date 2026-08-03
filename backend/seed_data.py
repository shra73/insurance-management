"""
Seed script for local/testing data.

Run with:
    python seed_data.py

Safe to run multiple times -- it checks for existing records by unique
fields (email, policy_number, etc.) and skips creating duplicates.
"""
from datetime import date, timedelta
from decimal import Decimal

from app import app
from extensions import db
from models.user import User
from models.customer import Customer
from models.policy import Policy
from models.premium import PremiumPayment
from models.claim import Claim


def get_or_create_user(name, email, password, role):
    user = User.query.filter_by(email=email).first()
    if user:
        print(f"  User already exists: {email} ({role})")
        return user
    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    print(f"  Created user: {email} / {password} ({role})")
    return user


def get_or_create_customer(name, dob, phone, address, email):
    customer = Customer.query.filter_by(email=email).first()
    if customer:
        print(f"  Customer already exists: {email}")
        return customer
    customer = Customer(name=name, dob=dob, phone=phone, address=address, email=email)
    db.session.add(customer)
    db.session.commit()
    print(f"  Created customer: {email}")
    return customer


def get_or_create_policy(customer_id, policy_number, ptype, start_date, end_date, premium_amount, status):
    policy = Policy.query.filter_by(policy_number=policy_number).first()
    if policy:
        print(f"  Policy already exists: {policy_number}")
        return policy
    policy = Policy(
        customer_id=customer_id,
        policy_number=policy_number,
        type=ptype,
        start_date=start_date,
        end_date=end_date,
        premium_amount=Decimal(premium_amount),
        status=status
    )
    db.session.add(policy)
    db.session.commit()
    print(f"  Created policy: {policy_number}")
    return policy


def get_or_create_premium_payment(policy_id, amount, payment_status, payment_date, payment_reference):
    if payment_reference:
        existing = PremiumPayment.query.filter_by(payment_reference=payment_reference).first()
        if existing:
            print(f"  Premium payment already exists: {payment_reference}")
            return existing
    payment = PremiumPayment(
        policy_id=policy_id,
        amount=Decimal(amount),
        payment_status=payment_status,
        payment_date=payment_date,
        payment_reference=payment_reference
    )
    db.session.add(payment)
    db.session.commit()
    print(f"  Created premium payment: {payment_reference or '(no ref)'} - {payment_status}")
    return payment


def get_or_create_claim(policy_id, claim_number, claim_amount, claim_date, description):
    claim = Claim.query.filter_by(claim_number=claim_number).first()
    if claim:
        print(f"  Claim already exists: {claim_number}")
        return claim
    claim = Claim(
        policy_id=policy_id,
        claim_number=claim_number,
        claim_amount=Decimal(claim_amount),
        claim_date=claim_date,
        status="PENDING",
        description=description
    )
    db.session.add(claim)
    db.session.commit()
    print(f"  Created claim: {claim_number}")
    return claim


def run_seed():
    with app.app_context():
        print("Seeding users...")
        admin = get_or_create_user("Test Admin", "admin@test.com", "Admin@123", "ADMIN")
        agent = get_or_create_user("Test Agent", "agent@test.com", "Agent@123", "AGENT")
        customer_user1 = get_or_create_user("John Customer", "customer1@test.com", "Customer@123", "CUSTOMER")
        customer_user2 = get_or_create_user("Priya Customer", "customer2@test.com", "Customer@123", "CUSTOMER")

        print("\nSeeding customers...")
        cust1 = get_or_create_customer(
            "John Doe", date(1990, 5, 20), "9876543210",
            "12 MG Road, Bengaluru", "john.doe@test.com"
        )
        cust2 = get_or_create_customer(
            "Priya Sharma", date(1988, 11, 3), "9123456780",
            "45 Nehru Nagar, Pune", "priya.sharma@test.com"
        )
        cust3 = get_or_create_customer(
            "Ahmed Khan", date(1995, 2, 14), "9988776655",
            "78 Anna Salai, Chennai", "ahmed.khan@test.com"
        )

        print("\nSeeding policies...")
        today = date.today()
        policy1 = get_or_create_policy(
            cust1.id, "POL-SEED-1001", "HEALTH",
            today - timedelta(days=180), today + timedelta(days=185),
            "50000.00", "ACTIVE"
        )
        policy2 = get_or_create_policy(
            cust2.id, "POL-SEED-1002", "LIFE",
            today - timedelta(days=365), today + timedelta(days=15),
            "120000.00", "ACTIVE"
        )
        policy3 = get_or_create_policy(
            cust3.id, "POL-SEED-1003", "MOTOR",
            today - timedelta(days=400), today - timedelta(days=35),
            "18000.00", "EXPIRED"
        )
        policy4 = get_or_create_policy(
            cust1.id, "POL-SEED-1004", "HOME",
            today - timedelta(days=30), today + timedelta(days=335),
            "35000.00", "PENDING"
        )

        print("\nSeeding premium payments...")
        get_or_create_premium_payment(
            policy1.id, "20000.00", "PAID", today - timedelta(days=170), "PAY-SEED-0001"
        )
        get_or_create_premium_payment(
            policy1.id, "15000.00", "PAID", today - timedelta(days=90), "PAY-SEED-0002"
        )
        get_or_create_premium_payment(
            policy1.id, "10000.00", "PENDING", None, "PAY-SEED-0003"
        )
        get_or_create_premium_payment(
            policy2.id, "120000.00", "PAID", today - timedelta(days=360), "PAY-SEED-0004"
        )
        get_or_create_premium_payment(
            policy3.id, "18000.00", "FAILED", None, "PAY-SEED-0005"
        )

        print("\nSeeding claims...")
        get_or_create_claim(
            policy1.id, "CLM-SEED-2001", "12000.00", today - timedelta(days=20),
            "Hospitalisation claim for medical treatment"
        )
        get_or_create_claim(
            policy2.id, "CLM-SEED-2002", "45000.00", today - timedelta(days=60),
            "Accidental injury claim"
        )
        get_or_create_claim(
            policy3.id, "CLM-SEED-2003", "8000.00", today - timedelta(days=100),
            "Minor vehicle collision"
        )

        print("\nSeeding complete!")
        print("\n" + "=" * 50)
        print("TEST LOGIN CREDENTIALS")
        print("=" * 50)
        print("ADMIN    -> admin@test.com    / Admin@123")
        print("AGENT    -> agent@test.com    / Agent@123")
        print("CUSTOMER -> customer1@test.com / Customer@123  (not linked to real customer data yet)")
        print("=" * 50)


if __name__ == "__main__":
    run_seed()