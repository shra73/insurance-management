import logging
from datetime import datetime, timedelta
from decimal import Decimal
from flask import current_app
from extensions import db
from models.policy import Policy
from models.premium import PremiumPayment
from models.premium_reminder import PremiumReminder
from services.email_service import send_premium_due_reminder_email
from services.email_service import send_policy_expiry_reminder_email

logger = logging.getLogger(__name__)


def _calculate_outstanding(policy):
    """
    Reuses the exact same outstanding-balance calculation already
    established in the Premium History endpoint and the Overpayment
    Prevention logic: sum of PAID payments for this policy, subtracted
    from the policy's total premium_amount. Not a separate/duplicated
    formula.
    """
    total_paid = db.session.query(
        db.func.coalesce(db.func.sum(PremiumPayment.amount), 0)
    ).filter(
        PremiumPayment.policy_id == policy.id,
        PremiumPayment.payment_status == "PAID"
    ).scalar()

    total_paid = Decimal(total_paid)
    return policy.premium_amount - total_paid


def run_premium_reminder_job():
    """
    Checks all ACTIVE policies with an outstanding balance whose
    (proxy) due date -- Policy.end_date, see the documented limitation --
    falls within PREMIUM_REMINDER_DAYS, and sends a reminder email for
    each one that hasn't already received a reminder for that exact
    due date.

    Returns a summary dict: processed / sent / skipped / failed.
    """
    reminder_days = current_app.config["PREMIUM_REMINDER_DAYS"]
    today = datetime.utcnow().date()
    window_end = today + timedelta(days=reminder_days)

    # Only ACTIVE policies are eligible (existing Policy.status convention),
    # and only those whose proxy due date (end_date) falls within the
    # configured reminder window, from today up to window_end inclusive.
    candidate_policies = Policy.query.filter(
        Policy.status == "ACTIVE",
        Policy.end_date >= today,
        Policy.end_date <= window_end
    ).all()

    processed = 0
    sent = 0
    skipped = 0
    failed = 0

    for policy in candidate_policies:
        processed += 1

        outstanding_amount = _calculate_outstanding(policy)

        # Not actually due if the premium is already fully paid.
        if outstanding_amount <= 0:
            skipped += 1
            continue

        due_date = policy.end_date

        customer = policy.customer
        if not customer or not customer.email:
            logger.warning(
                f"Skipping premium reminder: customer or email missing. policy_id={policy.id}"
            )
            skipped += 1
            continue

        # --- Duplicate prevention: check first, then rely on the unique
        # constraint as the real guarantee against a race condition. ---
        already_sent = PremiumReminder.query.filter_by(
            policy_id=policy.id,
            due_date=due_date,
            reminder_type="PREMIUM_DUE"
        ).first()

        if already_sent:
            skipped += 1
            continue

        days_remaining = (due_date - today).days

        try:
            success, error_message = send_premium_due_reminder_email(
                customer.email, customer.name, policy, outstanding_amount, due_date, days_remaining
            )
        except Exception:
            success = False
            error_message = "Unexpected error while sending"

        if not success:
            logger.error(
                f"Premium reminder email failed to send. policy_id={policy.id}, reason={error_message}"
            )
            failed += 1
            # Deliberately do NOT create a PremiumReminder record here --
            # a failed send must be retryable on the next scheduled run.
            continue

        # Only record the reminder as sent AFTER the email genuinely
        # succeeded. The unique constraint on (policy_id, due_date,
        # reminder_type) is the final safety net against a race condition
        # where two runs might both pass the "already_sent" check above
        # concurrently -- only one of them can successfully insert here.
        try:
            reminder_record = PremiumReminder(
                policy_id=policy.id,
                reminder_type="PREMIUM_DUE",
                due_date=due_date,
                sent_at=datetime.utcnow()
            )
            db.session.add(reminder_record)
            db.session.commit()
            sent += 1
        except Exception:
            db.session.rollback()
            logger.error(
                f"Reminder email sent but failed to record PremiumReminder row "
                f"(possible race condition or DB error). policy_id={policy.id}"
            )
            failed += 1

    logger.info(
        f"Premium reminder job completed. processed={processed}, sent={sent}, "
        f"skipped={skipped}, failed={failed}"
    )

    return {
        "processed": processed,
        "sent": sent,
        "skipped": skipped,
        "failed": failed
    }



def run_policy_expiry_reminder_job():
    """
    Checks all ACTIVE policies whose end_date (the existing model's actual
    expiry field) falls within POLICY_EXPIRY_REMINDER_DAYS, and sends an
    expiry reminder for each one that hasn't already received one for that
    exact expiry date. Reuses the same PremiumReminder table, distinguished
    by reminder_type="POLICY_EXPIRY" -- entirely independent from
    "PREMIUM_DUE" rows, since the unique constraint includes reminder_type.
    """
    reminder_days = current_app.config["POLICY_EXPIRY_REMINDER_DAYS"]
    today = datetime.utcnow().date()
    window_end = today + timedelta(days=reminder_days)

    # Not yet expired (end_date >= today) and within the reminder window.
    candidate_policies = Policy.query.filter(
        Policy.status == "ACTIVE",
        Policy.end_date >= today,
        Policy.end_date <= window_end
    ).all()

    processed = 0
    sent = 0
    skipped = 0
    failed = 0

    for policy in candidate_policies:
        processed += 1

        expiry_date = policy.end_date

        customer = policy.customer
        if not customer or not customer.email:
            logger.warning(
                f"Skipping policy expiry reminder: customer or email missing. policy_id={policy.id}"
            )
            skipped += 1
            continue

        already_sent = PremiumReminder.query.filter_by(
            policy_id=policy.id,
            due_date=expiry_date,
            reminder_type="POLICY_EXPIRY"
        ).first()

        if already_sent:
            skipped += 1
            continue

        days_remaining = (expiry_date - today).days

        try:
            success, error_message = send_policy_expiry_reminder_email(
                customer.email, customer.name, policy, expiry_date, days_remaining
            )
        except Exception:
            success = False
            error_message = "Unexpected error while sending"

        if not success:
            logger.error(
                f"Policy expiry reminder email failed to send. policy_id={policy.id}, reason={error_message}"
            )
            failed += 1
            continue

        try:
            reminder_record = PremiumReminder(
                policy_id=policy.id,
                reminder_type="POLICY_EXPIRY",
                due_date=expiry_date,
                sent_at=datetime.utcnow()
            )
            db.session.add(reminder_record)
            db.session.commit()
            sent += 1
        except Exception:
            db.session.rollback()
            logger.error(
                f"Expiry reminder email sent but failed to record PremiumReminder row "
                f"(possible race condition or DB error). policy_id={policy.id}"
            )
            failed += 1

    logger.info(
        f"Policy expiry reminder job completed. processed={processed}, sent={sent}, "
        f"skipped={skipped}, failed={failed}"
    )

    return {
        "processed": processed,
        "sent": sent,
        "skipped": skipped,
        "failed": failed
    }