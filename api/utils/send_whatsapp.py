import os
from dotenv import load_dotenv
import requests
from django.core.exceptions import ImproperlyConfigured
import logging
import json

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self):
        self.api_key = os.getenv("NGUMZO_API_KEY")
        self.api_url = "https://ngumzo.com/v1/send-message"
        self.sender_number = os.getenv("WHATSAPP_SENDER_NUMBER")

        if not self.api_key:
            raise ImproperlyConfigured(
                "NGUMZO_API_KEY is not set in environment variables."
            )
        if not self.sender_number:
            raise ImproperlyConfigured(
                "WHATSAPP_SENDER_NUMBER is not set in environment variables."
            )

    def send_text_message(self, recipient_number, message_text):
        """
        Sends a simple text message via WhatsApp using Ngumzo's API.

        Args:
            recipient_number (str): Recipient's WhatsApp number with country code.
            message_text (str): The text message to send.

        Returns:
            dict: Response from the Ngumzo API.

        Raises:
            ValueError: If there is an error sending the message.
        """
        try:
            # Prepare the request payload for a text message
            payload = {
                "sender": self.sender_number,
                "recipient": recipient_number,
                "message": message_text,  # Changed from "text" to "message" per Ngumzo API
            }

            # Set up headers
            headers = {
                "Content-Type": "application/json",
                "api-key": self.api_key,
            }

            # Send the WhatsApp message
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()

            logger.info(
                "WhatsApp text message sent successfully to %s.", recipient_number
            )
            return response.json()

        except requests.exceptions.RequestException as e:
            error_message = str(e)
            if hasattr(e, "response") and e.response:
                try:
                    error_detail = e.response.json()
                    error_message = f"{error_message}: {json.dumps(error_detail)}"
                except:
                    pass

            logger.error(
                "Failed to send WhatsApp text message to %s: %s",
                recipient_number,
                error_message,
            )
            raise ValueError(f"Failed to send WhatsApp text message: {error_message}")

    def send_whatsapp_message(self, recipient_number, template_name, variables=None):
        """
        Note: The Ngumzo API appears to only support simple text messages based on the provided documentation.
        This method is maintained for backward compatibility but will use the text message API.
        It will convert the template and variables to a simple text message.

        Args:
            recipient_number (str): Recipient's WhatsApp number with country code.
            template_name (str): Not used with Ngumzo API.
            variables (dict, optional): Variables to populate in the message.

        Returns:
            dict: Response from the Ngumzo API.
        """
        # Log that we're using a simpler approach with Ngumzo
        logger.warning(
            "Template-based messages are not directly supported by Ngumzo API. "
            "Converting to simple text message."
        )

        # Convert template variables to a text message (simplified approach)
        message_text = f"Message using template: {template_name}"

        if variables:
            if "body" in variables and isinstance(variables["body"], list):
                message_text = " ".join(variables["body"])
            if "header" in variables:
                message_text = f"{variables['header']}\n\n{message_text}"
            if "footer" in variables:
                message_text = f"{message_text}\n\n{variables['footer']}"

        # Use the text message method
        return self.send_text_message(recipient_number, message_text)
