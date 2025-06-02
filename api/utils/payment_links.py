import base64
import json
import hashlib
import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class PaymentLinkGenerator:
    """
    Utility class to generate and validate encrypted payment links
    """

    def __init__(self):
        self.frontend_url = os.getenv("FRONTEND_URL")
        # Use a secret key from environment variables
        self.secret_key = os.getenv("PAYMENT_LINK_SECRET_KEY", os.getenv("SECRET_KEY"))

        # Generate a key for encryption
        salt = b"payment_link_salt"  # This should ideally be stored securely
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.secret_key.encode()))
        self.cipher = Fernet(key)

    def generate_payment_link(self, payment_data):
        """
        Generate an encrypted payment link
        Args:
            payment_data (dict): Payment data to encrypt
        Returns:
            str: Encrypted payment link URL
        """
        try:
            # Add checksum to verify data integrity
            payment_data["checksum"] = self._generate_checksum(payment_data)
            # Convert payment data to JSON and encrypt
            data_json = json.dumps(payment_data)
            encrypted_data = self.cipher.encrypt(data_json.encode())
            # Convert to URL-safe base64
            token = base64.urlsafe_b64encode(encrypted_data).decode()
            # Generate the URL
            payment_url = f"{self.frontend_url}/payments?token={token}"
            return payment_url
        except Exception as e:
            logger.exception(f"Error generating payment link: {str(e)}")
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
