import os
import smtplib
import ssl

from dotenv import load_dotenv

load_dotenv()


def send_emails(emails: list[dict], recipients: list[str]) -> None:
    """Sends emails

    Args:
        emails (list[dict]): list of emails to send
    """
    data = zip(emails, recipients)
    port = 465  # For SSL
    smtp_server = "smtp.gmail.com"
    sender_email = os.environ.get("EMAIL")  # Enter your address
    password = os.environ.get("PASSWORD")  # Enter receiver address
    context = ssl.create_default_context()

    for email, recipient in data:
        receiver_email = recipient
        message = email["body"]

        with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, message)
