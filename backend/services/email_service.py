import logging
from flask_mail import Message
from extensions import mail
from datetime import datetime
from flask import render_template

logger = logging.getLogger(__name__)


def send_email(subject, recipients, body, cc=None, bcc=None):
    """
    Send a plain-text email.

    subject:    email subject line
    recipients: list of recipient email addresses
    body:       plain text body
    cc:         optional list of CC addresses
    bcc:        optional list of BCC addresses
    """
    return _send(subject, recipients, body=body, cc=cc, bcc=bcc)


def send_html_email(subject, recipients, html_body, cc=None, bcc=None):
    """
    Send an HTML email.

    subject:    email subject line
    recipients: list of recipient email addresses
    html_body:  HTML content for the email body
    cc:         optional list of CC addresses
    bcc:        optional list of BCC addresses
    """
    return _send(subject, recipients, html=html_body, cc=cc, bcc=bcc)


def send_email_with_attachment(subject, recipients, body=None, html=None,
                                attachments=None, cc=None, bcc=None):
    """
    Send an email (plain text and/or HTML) with one or more file attachments.

    attachments: list of dicts, each like:
        {
            "filename": "report.pdf",
            "content_type": "application/pdf",
            "data": <bytes>
        }
    """
    return _send(subject, recipients, body=body, html=html,
                  attachments=attachments, cc=cc, bcc=bcc)


def _send(subject, recipients, body=None, html=None, attachments=None, cc=None, bcc=None):
    """
    Internal shared sender. All public functions above funnel through this
    one place, so SMTP error handling and logging only need to exist once.
    """
    if not recipients:
        logger.error("Email send attempted with no recipients.")
        return False, "No recipients provided"

    try:
        msg = Message(
            subject=subject,
            recipients=recipients,
            cc=cc or [],
            bcc=bcc or []
        )

        if body:
            msg.body = body
        if html:
            msg.html = html

        if attachments:
            for attachment in attachments:
                msg.attach(
                    filename=attachment["filename"],
                    content_type=attachment.get("content_type", "application/octet-stream"),
                    data=attachment["data"]
                )

        mail.send(msg)

        # Log only safe, non-sensitive metadata — never credentials, never
        # full email body content that might contain personal/financial data.
        logger.info(
            f"Email sent successfully. subject='{subject}', "
            f"recipient_count={len(recipients)}"
        )
        return True, None

    except Exception as e:
        # Never log or expose the SMTP password, the raw exception's
        # underlying connection details, or full stack traces to the
        # caller — only a safe, generic message.
        logger.error(
            f"Failed to send email. subject='{subject}', "
            f"recipient_count={len(recipients)}, error_type={type(e).__name__}"
        )
        return False, "Failed to send email"

    

def send_welcome_email(user_email, user_name):
    """
    Sends the welcome email after successful registration, using the
    existing shared HTML-sending mechanism. Failures here are reported
    back as (False, message) rather than raised, so the caller (the
    registration route) can decide how to handle it without needing to
    know anything about SMTP internals.
    """
    html_body = render_template(
        "emails/welcome.html",
        user_name=user_name,
        login_url="http://127.0.0.1:5000/",  # placeholder until a real frontend URL exists
        current_year=datetime.utcnow().year
    )

    return send_html_email(
        subject="Welcome to Insurance Management Platform",
        recipients=[user_email],
        html_body=html_body
    )

def send_policy_created_email(customer_email, customer_name, policy):
    """
    Sends the policy confirmation email after a policy is successfully
    created and committed. `policy` is the actual Policy model instance
    that was just saved, so every value shown comes straight from the
    trusted database record — nothing here is re-derived or guessed.
    """
    formatted_premium = f"\u20b9{policy.premium_amount:,.2f}"

    html_body = render_template(
        "emails/policy_created.html",
        customer_name=customer_name,
        policy_number=policy.policy_number,
        policy_type=policy.type,
        premium_amount=formatted_premium,
        start_date=policy.start_date.isoformat() if policy.start_date else "",
        end_date=policy.end_date.isoformat() if policy.end_date else "",
        status=policy.status,
        current_year=datetime.utcnow().year
    )

    return send_html_email(
        subject="Your Insurance Policy Has Been Successfully Created",
        recipients=[customer_email],
        html_body=html_body
    )

def send_premium_payment_email(customer_email, customer_name, payment, policy, previous_outstanding, remaining_outstanding):
    """
    Sends the premium payment receipt email after a payment is successfully
    created and committed. `payment` and `policy` are the actual committed
    model instances, and both outstanding-amount values are passed in
    already-calculated by the caller (reusing the existing Premium History
    calculation logic) rather than being recomputed here.
    """
    formatted_amount = f"\u20b9{payment.amount:,.2f}"
    formatted_previous_outstanding = f"\u20b9{previous_outstanding:,.2f}"
    formatted_remaining_outstanding = f"\u20b9{remaining_outstanding:,.2f}"

    html_body = render_template(
        "emails/premium_payment.html",
        customer_name=customer_name,
        payment_reference=payment.payment_reference or f"PMT-{payment.id}",
        policy_number=policy.policy_number,
        policy_type=policy.type,
        amount_paid=formatted_amount,
        payment_date=payment.payment_date.isoformat() if payment.payment_date else "N/A",
        payment_status=payment.payment_status,
        previous_outstanding=formatted_previous_outstanding,
        remaining_outstanding=formatted_remaining_outstanding,
        current_year=datetime.utcnow().year
    )

    return send_html_email(
        subject="Premium Payment Receipt - Insurance Management Platform",
        recipients=[customer_email],
        html_body=html_body
    )

CLAIM_STATUS_MESSAGES = {
    "PENDING": "Your claim has been received and is pending initial processing.",
    "UNDER_REVIEW": "Your claim is currently under review.",
    "APPROVED": "Your claim has been approved.",
    "REJECTED": "Your claim has been rejected. Please contact the insurance support team for further information.",
    "SETTLED": "Your claim has been settled."
}


def send_claim_status_email(customer_email, customer_name, claim, policy, old_status, new_status):
    """
    Sends the claim status change notification. `claim` and `policy` are the
    actual committed model instances, so every value shown comes directly
    from the trusted database record.
    """
    status_message = CLAIM_STATUS_MESSAGES.get(
        new_status,
        f"Your claim status has been updated to {new_status}."
    )

    formatted_claim_amount = (
        f"\u20b9{claim.claim_amount:,.2f}" if claim.claim_amount is not None else None
    )

    html_body = render_template(
        "emails/claim_status_update.html",
        customer_name=customer_name,
        status_message=status_message,
        claim_number=claim.claim_number,
        policy_number=policy.policy_number,
        claim_amount=formatted_claim_amount,
        old_status=old_status,
        new_status=new_status,
        updated_date=claim.updated_at.strftime("%Y-%m-%d %H:%M:%S") if claim.updated_at else "",
        current_year=datetime.utcnow().year
    )

    return send_html_email(
        subject="Claim Status Update - Insurance Management Platform",
        recipients=[customer_email],
        html_body=html_body
    )