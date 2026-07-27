import logging
from flask_mail import Message
from extensions import mail

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