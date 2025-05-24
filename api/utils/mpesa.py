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
            url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            print("Getting access token with credentials:")
            print(
                f"Consumer Key: {self.consumer_key[:5]}...{self.consumer_key[-5:]}"
            )  # Just show first/last 5 chars for security

            auth = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode()
            ).decode()
            headers = {"Authorization": f"Basic {auth}"}

            response = requests.get(url, headers=headers, timeout=30)
            print(f"Access token response status: {response.status_code}")

            # Print response body for debugging (be careful with tokens in logs)
            if response.status_code != 200:
                print(f"Error response: {response.text}")

            response.raise_for_status()
            result = response.json()
            print("this is the result", result)
            self.access_token = result.get("access_token")
            return self.access_token
        except RequestException as e:
            logger.error(f"Error getting access token: {str(e)}")
            raise

    def register_callback_url(self, confirmation_url, validation_url):
        """Register C2B callback URLs with M-Pesa"""
        try:
            # Always get a fresh token to avoid using expired tokens
            access_token = self.get_access_token()
            print("this is access token", access_token)

            url = f"{self.api_url}/mpesa/c2b/v1/registerurl"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "ShortCode": self.shortcode,
                "ResponseType": "Completed",
                "ConfirmationURL": confirmation_url,
                "ValidationURL": validation_url,
            }

            # Add debugging to see actual request
            print(f"Making request to: {url}")
            print(f"Headers: {headers}")
            print(f"Payload: {json.dumps(payload, indent=2)}")

            response = requests.post(url, json=payload, headers=headers, timeout=30)

            # Print the complete response for debugging
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")

            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Error registering callback URLs: {str(e)}")
            raise

    def simulate_c2b_transaction(self, phone_number, amount, account_number):
        """Simulate a C2B transaction (for testing in sandbox)"""
        print("sumulation was called")
        try:
            if not self.access_token:
                self.get_access_token()

            url = f"{self.api_url}/mpesa/c2b/v1/simulate"
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
            print("This is the payload", payload)

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            print("this is response")
            print(response.text)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Error simulating C2B transaction: {str(e)}")
            raise
