import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(subject, body, to_email, cfg):
    """Send email via SMTP. Returns True if sent, False otherwise."""
    smtp_host = cfg.get('SMTP_HOST')
    smtp_port = cfg.get('SMTP_PORT', 587)
    smtp_user = cfg.get('SMTP_USER')
    smtp_pass = cfg.get('SMTP_PASS')
    smtp_from = cfg.get('SMTP_FROM', smtp_user or 'no-reply@ielts.local')

    if not to_email:
        print("[EMAIL SKIPPED] Missing recipient")
        print(f"Subject: {subject}")
        print(body)
        return False

    if not smtp_host or not smtp_user or not smtp_pass:
        # Development fallback: keep behavior observable in logs.
        print("[EMAIL SKIPPED] SMTP not configured")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(body)
        return False

    message = MIMEMultipart()
    message['From'] = smtp_from
    message['To'] = to_email
    message['Subject'] = subject
    message.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, to_email, message.as_string())
    return True
