import logging
from datetime import datetime
from flask import render_template
from flask_mail import Message
from extensions import mail

logger = logging.getLogger(__name__)


def send_email(subject, recipients, body, cc=None, bcc=None):
    return _send(subject, recipients, body=body, cc=cc, bcc=bcc)


def send_html_email(subject, recipients, html_body, cc=None, bcc=None):
    return _send(subject, recipients, html=html_body, cc=cc, bcc=bcc)


def send_email_with_attachment(subject, recipients, body=None, html=None,
                                attachments=None, cc=None, bcc=None):
    return _send(subject, recipients, body=body, html=html,
                  attachments=attachments, cc=cc, bcc=bcc)


def send_welcome_email(user_email, user_name):
    html_body = render_template(
        "emails/welcome.html",
        user_name=user_name,
        login_url="http://127.0.0.1:5000/",
        current_year=datetime.utcnow().year
    )

    return send_html_email(
        subject="Welcome to Insurance Management Platform",
        recipients=[user_email],
        html_body=html_body
    )


def _send(subject, recipients, body=None, html=None, attachments=None, cc=None, bcc=None):
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

        logger.info(
            f"Email sent successfully. subject='{subject}', "
            f"recipient_count={len(recipients)}"
        )
        return True, None

    except Exception as e:
        logger.error(
            f"Failed to send email. subject='{subject}', "
            f"recipient_count={len(recipients)}, error_type={type(e).__name__}"
        )
        return False, "Failed to send email"
