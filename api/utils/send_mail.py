import os
from dotenv import load_dotenv
import requests
from django.template.loader import render_to_string
from django.core.exceptions import ImproperlyConfigured
import logging

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.api_key = os.getenv("BREVO_API_KEY")
        self.api_url = "https://api.sendinblue.com/v3/smtp/email"
        if not self.api_key:
            raise ImproperlyConfigured(
                "BREVO_API_KEY is not set in environment variables."
            )

    def send_email(
        self, recipient_email, recipient_name, subject, template_name, context
    ):
        """
        Sends an email using Brevo's API.

        Args:
            recipient_email (str): Recipient's email address.
            recipient_name (str): Recipient's name.
            subject (str): Subject of the email.
            template_name (str): Path to the HTML template for the email.
            context (dict): Context data to render the template.

        Returns:
            dict: Response from the Brevo API.

        Raises:
            ValueError: If there is an error sending the email.
        """
        try:
            # Render the HTML template
            html_content = render_to_string(template_name, context)

            # Prepare the request payload
            payload = {
                "sender": {
                    "name": os.getenv("SENDER_NAME", "assettonerealestates"),
                    "email": os.getenv("SENDER_EMAIL", "assettoneestates@gmail.com"),
                },
                "to": [{"email": recipient_email, "name": recipient_name}],
                "subject": subject,
                "htmlContent": html_content,
            }

            # Set up headers
            headers = {
                "accept": "application/json",
                "api-key": self.api_key,
                "Content-Type": "application/json",
            }

            # Send the email
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()  # Raise error for HTTP errors

            logger.info(
                "Email sent successfully to %s (%s).", recipient_name, recipient_email
            )
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(
                "Failed to send email to %s (%s): %s",
                recipient_name,
                recipient_email,
                str(e),
            )
            raise ValueError(f"Failed to send email: {str(e)}")
