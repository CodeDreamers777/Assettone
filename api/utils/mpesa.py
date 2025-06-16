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

        # V2 API tokens (for C2B endpoints)
        self.access_token_v2 = None
        self.access_token_v2_expiry = None
        self.access_token_v2_generated_at = None

        # V1 API tokens (for STK Push endpoints)
        self.access_token_v1 = None
        self.access_token_v1_expiry = None
        self.access_token_v1_generated_at = None

    def get_access_token_v2(self):
        """Get OAuth access token for V2 endpoints (C2B)"""
        try:
            url = "https://api.safaricom.co.ke/oauth/v2/generate?grant_type=client_credentials"

            auth = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode("utf-8")
            ).decode("utf-8")
            headers = {"Authorization": f"Basic {auth}"}

            response = requests.get(url, headers=headers, timeout=30)
            print(f"V2 Access token response status: {response.status_code}")

            if response.status_code != 200:
                print(f"V2 Error response: {response.text}")

            response.raise_for_status()
            result = response.json()
            self.access_token_v2 = result.get("access_token")
            self.access_token_v2_generated_at = datetime.now()
            self.access_token_v2_expiry = result.get("expires_in")

            return self.access_token_v2
        except RequestException as e:
            logger.error(f"Error getting V2 access token: {str(e)}")
            raise

    def get_access_token_v1(self):
        """Get OAuth access token for V1 endpoints (STK Push)"""
        try:
            url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

            auth = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode("utf-8")
            ).decode("utf-8")
            headers = {"Authorization": f"Basic {auth}"}

            response = requests.get(url, headers=headers, timeout=30)
            print(f"V1 Access token response status: {response.status_code}")

            if response.status_code != 200:
                print(f"V1 Error response: {response.text}")

            response.raise_for_status()
            result = response.json()
            self.access_token_v1 = result.get("access_token")
            self.access_token_v1_generated_at = datetime.now()
            self.access_token_v1_expiry = result.get("expires_in")

            return self.access_token_v1
        except RequestException as e:
            logger.error(f"Error getting V1 access token: {str(e)}")
            raise

    def validate_access_token_v2(self):
        """Validate V2 access token"""
        if (
            not self.access_token_v2
            or not self.access_token_v2_expiry
            or not self.access_token_v2_generated_at
        ):
            return False

        now = datetime.now()
        expiry_time = self.access_token_v2_generated_at + timedelta(
            seconds=(self.access_token_v2_expiry - 10)
        )
        return expiry_time > now

    def validate_access_token_v1(self):
        """Validate V1 access token"""
        if (
            not self.access_token_v1
            or not self.access_token_v1_expiry
            or not self.access_token_v1_generated_at
        ):
            return False

        now = datetime.now()
        expiry_time = self.access_token_v1_generated_at + timedelta(
            seconds=(self.access_token_v1_expiry - 10)
        )
        return expiry_time > now

    # Legacy methods for backward compatibility
    def get_access_token(self):
        """Legacy method - defaults to V2 for backward compatibility"""
        return self.get_access_token_v2()

    def validate_access_token(self):
        """Legacy method - defaults to V2 for backward compatibility"""
        return self.validate_access_token_v2()

    @property
    def access_token(self):
        """Legacy property - defaults to V2 for backward compatibility"""
        return self.access_token_v2

    def register_callback_url(self, confirmation_url, validation_url):
        """Register C2B callback URLs with M-Pesa (uses V2 API)"""
        try:
            # Use V2 token for C2B endpoints
            access_token = (
                self.access_token_v2
                if self.validate_access_token_v2()
                else self.get_access_token_v2()
            )
            print("C2B Register - V2 access token:", access_token)

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

            print(f"C2B Register - Making request to: {url}")
            print(f"C2B Register - Headers: {headers}")
            print(f"C2B Register - Payload: {json.dumps(payload, indent=2)}")

            response = requests.post(url, json=payload, headers=headers, timeout=30)

            print(f"C2B Register - Response status: {response.status_code}")
            print(f"C2B Register - Response body: {response.text}")

            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Error registering callback URLs: {str(e)}")
            raise

    def stk_push(
        self, phone_number, amount, account_reference, transaction_desc="Rent Payment"
    ):
        """Send STK push to customer's phone (uses V1 API)"""
        try:
            # Use V1 token specifically for STK Push
            access_token = (
                self.access_token_v1
                if self.validate_access_token_v1()
                else self.get_access_token_v1()
            )
            print("STK Push - V1 access token:", access_token)

            url = f"{self.api_url}/mpesa/stkpush/v1/processrequest"

            # Generate timestamp
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

            # Generate password (Base64 encoded string of Shortcode+Passkey+Timestamp)
            password_string = f"{self.shortcode}{self.passkey}{timestamp}"
            password = base64.b64encode(password_string.encode()).decode("utf-8")

            headers = {
                "Authorization": f"Bearer {access_token}",
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

            print(f"STK Push - Making request to: {url}")
            print(f"STK Push - Headers: {headers}")
            print(f"STK Push - Payload: {json.dumps(payload, indent=2)}")

            response = requests.post(url, json=payload, headers=headers, timeout=30)

            print(f"STK Push - Response status: {response.status_code}")
            print(f"STK Push - Response body: {response.text}")

            response.raise_for_status()
            return response.json()

        except RequestException as e:
            logger.error(f"Error sending STK push: {str(e)}")
            raise

    def simulate_c2b_transaction(self, phone_number, amount, account_number):
        """Simulate a C2B transaction (for testing in sandbox) - uses V2 API"""
        print("C2B simulation was called")
        try:
            # Use V2 token for C2B simulation
            access_token = (
                self.access_token_v2
                if self.validate_access_token_v2()
                else self.get_access_token_v2()
            )
            print("C2B Simulation - V2 access token:", access_token)

            url = f"{self.api_url}/mpesa/c2b/v2/simulate"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "ShortCode": self.shortcode,
                "CommandID": "CustomerPayBillOnline",
                "Amount": amount,
                "Msisdn": phone_number,
                "BillRefNumber": account_number,
            }
            print("C2B Simulation - Payload:", payload)

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            print("C2B Simulation - Response:", response.text)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Error simulating C2B transaction: {str(e)}")
            raise
