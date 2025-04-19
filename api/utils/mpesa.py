# utils/mpesa.py
import requests
import base64
import logging
import json
from requests.exceptions import RequestException
from django.conf import settings

logger = logging.getLogger(__name__)


class MpesaClient:
    """
    Client for interacting with the M-Pesa Daraja API
    """

    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.api_url = settings.MPESA_API_URL
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.access_token = None

    def get_access_token(self):
        """Get OAuth access token from M-Pesa"""
        try:
            url = f"{self.api_url}/oauth/v1/generate?grant_type=client_credentials"
            auth = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode()
            ).decode()
            headers = {"Authorization": f"Basic {auth}"}

            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            result = response.json()
            self.access_token = result.get("access_token")
            return self.access_token
        except RequestException as e:
            logger.error(f"Error getting access token: {str(e)}")
            raise

    def register_callback_url(self, confirmation_url, validation_url):
        """Register C2B callback URLs with M-Pesa"""
        try:
            if not self.access_token:
                self.get_access_token()

            url = f"{self.api_url}/c2b/v1/registerurl"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "ShortCode": self.shortcode,
                "ResponseType": "Completed",
                "ConfirmationURL": confirmation_url,
                "ValidationURL": validation_url,
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Error registering callback URLs: {str(e)}")
            raise

    def simulate_c2b_transaction(self, phone_number, amount, account_number):
        """Simulate a C2B transaction (for testing in sandbox)"""
        try:
            if not self.access_token:
                self.get_access_token()

            url = f"{self.api_url}/c2b/v1/simulate"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "ShortCode": self.shortcode,
                "CommandID": "CustomerPayBillOnline",
                "Amount": amount,
                "Msisdn": phone_number,
                "BillRefNumber": account_number,
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Error simulating C2B transaction: {str(e)}")
            raise
