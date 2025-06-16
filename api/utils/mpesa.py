# utils/mpesa.py
import requests
import base64
import logging
import json
from datetime import datetime, timedelta
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
        self.access_token_expiry = None
        self.access_token_generated_at = None

    def get_access_token(self):
        """Get OAuth access token from M-Pesa"""
        try:
            url = "https://api.safaricom.co.ke/oauth/v2/generate?grant_type=client_credentials"

            auth = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode("utf-8")
            ).decode("utf-8")
            headers = {"Authorization": f"Basic {auth}"}

            response = requests.get(url, headers=headers, timeout=30)
            print(f"Access token response status: {response.status_code}")

            # Print response body for debugging (be careful with tokens in logs)
            if response.status_code != 200:
                print(f"Error response: {response.text}")

            response.raise_for_status()
            result = response.json()
            self.access_token = result.get("access_token")
            self.access_token_generated_at = datetime.now()
            self.access_token_expiry = result.get("expires_in")

            return self.access_token
        except RequestException as e:
            logger.error(f"Error getting access token: {str(e)}")
            raise

    def validate_access_token(self):
        # Check if all required token fields are present
        if (
            not self.access_token
            or not self.access_token_expiry
            or not self.access_token_generated_at
        ):
            return False

        now = datetime.now()
        # Check if token is still valid (with 10 second buffer)
        expiry_time = self.access_token_generated_at + timedelta(
            seconds=(self.access_token_expiry - 10)
        )
        return expiry_time > now

    def register_callback_url(self, confirmation_url, validation_url):
        """Register C2B callback URLs with M-Pesa"""
        try:
            # Always get a fresh token to avoid using expired tokens
            access_token = (
                self.access_token
                if self.validate_access_token()
                else self.get_access_token()
            )
            print("this is access token", access_token)

            url = (
                f"{self.api_url}/mpesa/c2b/v2/registerurl?grant_type=client_credentials"
            )
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

    def stk_push(
        self, phone_number, amount, account_reference, transaction_desc="Rent Payment"
    ):
        """Send STK push to customer's phone"""
        try:
            if not self.validate_access_token():
                self.get_access_token()

            url = f"{self.api_url}/mpesa/stkpushquery/v2/query"

            # Generate timestamp
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

            # Generate password (Base64 encoded string of Shortcode+Passkey+Timestamp)
            password_string = f"{self.shortcode}{self.passkey}{timestamp}"
            password = base64.b64encode(password_string.encode()).decode("utf-8")

            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }

            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),
                "PartyA": phone_number,
                "PartyB": self.shortcode,
                "PhoneNumber": phone_number,
                "CallBackURL": "https://assettone-rental-management.onrender.com/api/v1/payment/confirmation/",
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc,
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()

        except RequestException as e:
            logger.error(f"Error sending STK push: {str(e)}")
            raise

    def simulate_c2b_transaction(self, phone_number, amount, account_number):
        """Simulate a C2B transaction (for testing in sandbox)"""
        print("sumulation was called")
        try:
            if not self.access_token:
                self.get_access_token()

            url = f"{self.api_url}/mpesa/c2b/v2/simulate"
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
