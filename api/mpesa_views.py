# views/mpesa_views.py
import json
import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.utils import timezone
from .models import (
    Unit,
    Tenant,
    Property,
    RentPeriodStatus,
    MpesaTransaction,
    Lease,
    LeaseStatus,
    RentPayment,
)
from .tasks import process_rent_payment
from .utils.mpesa import MpesaClient
from django.db import transaction

logger = logging.getLogger(__name__)


class MpesaValidationAPIView(APIView):
    permission_classes = [AllowAny]  # M-Pesa API needs to access this endpoint

    def post(self, request, *args, **kwargs):
        """
        M-Pesa validation callback - verify if the account number is valid
        This is called by M-Pesa before completing a transaction
        """
        try:
            data = request.data
            logger.info(f"Received M-Pesa validation request: {data}")

            # Extract account number (Bill Reference Number)
            account_number = data.get("BillRefNumber")

            if not account_number:
                logger.error("Missing BillRefNumber in validation request")
                return Response(
                    {
                        "ResultCode": 1,
                        "ResultDesc": "Rejected - Missing Account Number",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Parse account number to extract info
            # Format: PROP123-UNIT45 (Property Code + Unit Number)
            try:
                if "-" in account_number:
                    parts = account_number.split("-")
                    if len(parts) != 2:
                        raise ValueError("Invalid format")

                    prop_code, unit_number = parts
                    if not prop_code.startswith("PROP"):
                        raise ValueError("Invalid property code format")

                    prop_code = prop_code[4:]  # Remove 'PROP' prefix

                    # Check if property and unit exist
                    property_exists = Property.objects.filter(code=prop_code).exists()
                    unit_exists = Unit.objects.filter(
                        unit_number=unit_number, property__code=prop_code
                    ).exists()

                    # Check if there's an active lease for this unit
                    has_active_lease = Lease.objects.filter(
                        unit__unit_number=unit_number,
                        unit__property__code=prop_code,
                        status=LeaseStatus.ACTIVE,
                    ).exists()

                    if property_exists and unit_exists and has_active_lease:
                        logger.info(f"Validated account number: {account_number}")
                        return Response(
                            {"ResultCode": 0, "ResultDesc": "Accepted"},
                            status=status.HTTP_200_OK,
                        )
                    else:
                        reason = (
                            "Invalid Property or Unit"
                            if not (property_exists and unit_exists)
                            else "No Active Lease"
                        )
                        logger.warning(
                            f"Rejecting transaction: {reason} for account {account_number}"
                        )
                        return Response(
                            {"ResultCode": 1, "ResultDesc": f"Rejected - {reason}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    logger.warning(
                        f"Rejecting transaction: Invalid format for account {account_number}"
                    )
                    return Response(
                        {
                            "ResultCode": 1,
                            "ResultDesc": "Rejected - Incorrect Format (Expected PROP{code}-UNIT{number})",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception as e:
                logger.error(
                    f"Error validating account number {account_number}: {str(e)}"
                )
                return Response(
                    {"ResultCode": 1, "ResultDesc": "Rejected - Invalid Format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.exception(f"Unhandled exception in M-Pesa validation: {str(e)}")
            return Response(
                {"ResultCode": 1, "ResultDesc": "Internal Server Error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MpesaConfirmationAPIView(APIView):
    permission_classes = [AllowAny]  # M-Pesa API needs to access this endpoint

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """
        M-Pesa confirmation callback - process the payment
        This is called by M-Pesa after a transaction is completed
        """
        try:
            data = request.data
            logger.info(f"Received M-Pesa confirmation: {data}")

            # Required fields
            required_fields = [
                "TransID",
                "BillRefNumber",
                "MSISDN",
                "TransAmount",
                "TransTime",
            ]

            # Check all required fields are present
            for field in required_fields:
                if field not in data:
                    logger.error(f"Missing required field: {field}")
                    return Response(
                        {
                            "ResultCode": 1,
                            "ResultDesc": f"Missing required field: {field}",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Extract transaction details
            transaction_id = data.get("TransID")
            account_number = data.get("BillRefNumber")
            phone = data.get("MSISDN")
            amount = float(data.get("TransAmount"))

            # Parse transaction time with error handling
            try:
                transaction_date = datetime.strptime(
                    data.get("TransTime"), "%Y%m%d%H%M%S"
                )
            except ValueError:
                logger.error(f"Invalid TransTime format: {data.get('TransTime')}")
                transaction_date = timezone.now()

            # Check for duplicate transaction
            if MpesaTransaction.objects.filter(transaction_id=transaction_id).exists():
                logger.warning(f"Duplicate transaction received: {transaction_id}")
                return Response(
                    {
                        "ResultCode": 0,  # Still return success to M-Pesa
                        "ResultDesc": "Success - Transaction already processed",
                    },
                    status=status.HTTP_200_OK,
                )

            # Save the transaction
            transaction = MpesaTransaction.objects.create(
                transaction_id=transaction_id,
                phone_number=phone,
                amount=amount,
                account_number=account_number,
                transaction_date=transaction_date,
            )

            # Process payment immediately or queue for processing
            if settings.PROCESS_MPESA_PAYMENTS_ASYNC:
                # Queue for async processing
                logger.info(f"Queuing transaction {transaction_id} for processing")
                process_rent_payment.delay(str(transaction.id))
            else:
                # Process immediately
                logger.info(f"Processing transaction {transaction_id} immediately")
                self._process_payment(transaction)

            return Response(
                {"ResultCode": 0, "ResultDesc": "Success"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception(f"Unhandled exception in M-Pesa confirmation: {str(e)}")
            return Response(
                {
                    "ResultCode": 0,  # Still return success to M-Pesa to avoid reprocessing
                    "ResultDesc": "Success - Errors will be handled internally",
                },
                status=status.HTTP_200_OK,
            )

    def _process_payment(self, transaction):
        """
        Process payment immediately for synchronous handling
        """
        try:
            # Parse account number to get property and unit
            if "-" in transaction.account_number:
                parts = transaction.account_number.split("-")
                if len(parts) != 2:
                    raise ValueError("Invalid account number format")

                prop_code, unit_number = parts
                if not prop_code.startswith("PROP"):
                    raise ValueError("Invalid property code format")

                prop_code = prop_code[4:]  # Remove 'PROP' prefix

                # Find the property and unit
                property = Property.objects.get(code=prop_code)
                unit = Unit.objects.get(property=property, unit_number=unit_number)

                # Find active lease for this unit
                lease = (
                    Lease.objects.filter(unit=unit, status=LeaseStatus.ACTIVE)
                    .select_related("tenant")
                    .first()
                )

                if lease:
                    # Find the current rent period
                    rent_period = (
                        RentPeriodStatus.objects.filter(
                            lease=lease,
                            is_paid=False,
                            period_end_date__gte=timezone.now().date(),
                        )
                        .order_by("period_start_date")
                        .first()
                    )

                    if rent_period:
                        # Update the rent period with payment
                        rent_period.amount_paid += transaction.amount
                        rent_period.update_payment_status()

                        # Create RentPayment record
                        RentPayment.objects.create(
                            lease=lease,
                            amount=transaction.amount,
                            payment_date=transaction.transaction_date.date(),
                            payment_method="MOBILE_MONEY",
                            notes=f"M-Pesa Transaction ID: {transaction.transaction_id}",
                        )

                        # Update transaction with references
                        transaction.property = property
                        transaction.unit = unit
                        transaction.tenant = lease.tenant
                        transaction.rent_period = rent_period
                        transaction.processed = True
                        transaction.save()

                        logger.info(
                            f"Successfully processed payment for {lease.tenant} - Unit {unit.unit_number}"
                        )
                        return True
                    else:
                        error_msg = "No active rent period found for this lease"
                        transaction.processing_error = error_msg
                        transaction.processing_attempts += 1
                        transaction.last_attempt = timezone.now()
                        transaction.save()
                        logger.warning(f"{error_msg}: {lease}")
                else:
                    error_msg = "No active lease found for this unit"
                    transaction.processing_error = error_msg
                    transaction.processing_attempts += 1
                    transaction.last_attempt = timezone.now()
                    transaction.save()
                    logger.warning(f"{error_msg}: {unit}")
            else:
                error_msg = "Invalid account number format"
                transaction.processing_error = error_msg
                transaction.processing_attempts += 1
                transaction.last_attempt = timezone.now()
                transaction.save()
                logger.warning(f"{error_msg}: {transaction.account_number}")

            return False

        except (Property.DoesNotExist, Unit.DoesNotExist) as e:
            error_msg = f"Property or Unit not found: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.error(error_msg)
            return False

        except Exception as e:
            error_msg = f"Error processing payment: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.exception(error_msg)
            return False


class MpesaRegisterCallbackURLView(APIView):
    """
    View to register callback URLs with M-Pesa
    Requires admin authentication
    """

    def post(self, request, *args, **kwargs):
        try:
            mpesa_client = MpesaClient()
            validation_url = request.data.get("validation_url")
            confirmation_url = request.data.get("confirmation_url")

            if not validation_url or not confirmation_url:
                return Response(
                    {
                        "status": "error",
                        "message": "Both validation_url and confirmation_url are required",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = mpesa_client.register_callback_url(
                confirmation_url, validation_url
            )
            return Response(
                {"status": "success", "data": result}, status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception(f"Error registering M-Pesa callback URLs: {str(e)}")
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MpesaSimulatePaymentView(APIView):
    """
    View to simulate C2B transactions for testing in sandbox
    Should only be available in development environment
    """

    def post(self, request, *args, **kwargs):
        if not settings.MPESA_SANDBOX:
            return Response(
                {
                    "status": "error",
                    "message": "This endpoint is only available in sandbox mode",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            phone_number = request.data.get("phone_number")
            amount = request.data.get("amount")
            account_number = request.data.get("account_number")

            if not all([phone_number, amount, account_number]):
                return Response(
                    {
                        "status": "error",
                        "message": "phone_number, amount and account_number are required",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            mpesa_client = MpesaClient()
            result = mpesa_client.simulate_c2b_transaction(
                phone_number, amount, account_number
            )

            return Response(
                {"status": "success", "data": result}, status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception(f"Error simulating M-Pesa payment: {str(e)}")
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
