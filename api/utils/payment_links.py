import base64
import json
import hashlib
import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging
from api.models import PaymentReceipt

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class PaymentLinkGenerator:
    def __init__(self):
        self.frontend_url = os.getenv("FRONTEND_URL")

    def generate_payment_link(self, payment_data):
        """Generate short payment link with error handling"""
        try:
            # Validate payment data
            required_fields = ["tenant_id", "transaction_id", "amount_paid"]
            missing_fields = [
                field for field in required_fields if not payment_data.get(field)
            ]

            if missing_fields:
                logger.error(f"Missing required payment data fields: {missing_fields}")
                return None

            # Create receipt record
            receipt = PaymentReceipt.objects.create(payment_data=payment_data)

            # Return short URL
            short_url = f"{self.frontend_url}/api/receipt/{receipt.code}"
            logger.info(
                f"Generated short payment link: {short_url} for transaction {payment_data.get('transaction_id')}"
            )

            return short_url

        except Exception as e:
            logger.error(f"Error generating payment link: {str(e)}")
            return None

    def decrypt_payment_data(self, token):
        """
        Decrypt payment data from a token
        Args:
            token (str): Encrypted token
        Returns:
            dict: Decrypted payment data or None if invalid
        """
        try:
            # Decode from URL-safe base64
            encrypted_data = base64.urlsafe_b64decode(token)
            # Decrypt the data
            decrypted_data = self.cipher.decrypt(encrypted_data)
            # Parse JSON
            payment_data = json.loads(decrypted_data.decode())
            # Verify checksum
            original_checksum = payment_data.pop("checksum", None)
            if original_checksum:
                calculated_checksum = self._generate_checksum(payment_data)
                if original_checksum != calculated_checksum:
                    logger.warning("Payment link checksum validation failed")
                    return None
            return payment_data
        except Exception as e:
            logger.exception(f"Error decrypting payment token: {str(e)}")
            return None

    def _generate_checksum(self, data):
        """Generate a checksum for data integrity verification"""
        # Sort keys for consistent results
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256((data_str + self.secret_key).encode()).hexdigest()
