# views/mpesa_views.py
import json
import os
import pytz

from decimal import Decimal
import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.utils import timezone
from dateutil.relativedelta import relativedelta

from .models import (
    Unit,
    Tenant,
    PaymentPeriod,
    Property,
    RentPeriodStatus,
    MpesaTransaction,
    Lease,
    LeaseStatus,
    RentPayment,
    PaymentReceipt,
    CommunicationType,
    CommunicationHistory,
)
from .tasks import process_rent_payment
from .utils.mpesa import MpesaClient
from .utils.payment_links import PaymentLinkGenerator
from django.db import transaction
import threading

logger = logging.getLogger(__name__)


class MpesaBaseView(APIView):
    """Base class with common functionality for M-Pesa views"""

    def send_payment_receipt_whatsapp(self, transaction, rent_period, lease, tenant):
        try:
            from api.utils.send_whatsapp import WhatsAppService
            from decimal import Decimal

            # Format and log the tenant's phone number
            tenant_phone = tenant.phone_number
            logger.info(
                f"Generating receipt for tenant {tenant.id}, phone: {tenant_phone}"
            )

            # Validate tenant phone
            if not tenant_phone:
                logger.error(f"Tenant {tenant.id} has no phone number")
                return False

            # Calculate balance
            balance = rent_period.amount_due - rent_period.amount_paid

            # Get unit and water bill information
            unit = lease.unit
            current_water_bill = unit.get_current_water_bill()

            # Water bill reset check
            water_reset = unit.reset_water_units_if_needed()
            if water_reset:
                unit.save()

            # Generate payment data
            payment_data = {
                "tenant_id": str(tenant.id),
                "tenant_name": f"{tenant.first_name} {tenant.last_name}",
                "property_name": lease.unit.property.name,
                "unit_number": lease.unit.unit_number,
                "transaction_id": transaction.transaction_id,
                "amount_paid": float(transaction.amount),
                "payment_date": transaction.transaction_date.strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                "period_start": rent_period.period_start_date.strftime("%Y-%m-%d"),
                "period_end": rent_period.period_end_date.strftime("%Y-%m-%d"),
                "total_due": float(rent_period.amount_due),
                "total_paid": float(rent_period.amount_paid),
                "balance": float(balance),
                "is_paid": rent_period.is_paid,
                "water_units_used": float(unit.water_units_used),
                "water_price_per_unit": float(unit.water_price_per_unit),
                "water_bill_amount": float(current_water_bill),
                "water_bill_last_updated": unit.water_bill_last_updated.strftime(
                    "%Y-%m-%d"
                )
                if unit.water_bill_last_updated
                else None,
                "unit_rent": float(unit.rent),
                "payment_period": unit.payment_period,
                "timestamp": datetime.now().timestamp(),
            }

            # Generate SHORT payment link with error handling
            link_generator = PaymentLinkGenerator()
            payment_link = link_generator.generate_payment_link(payment_data)

            if not payment_link:
                logger.error(
                    f"Failed to generate payment link for transaction {transaction.transaction_id}"
                )
                # Fallback to a general receipts page
                payment_link = f"{os.getenv('FRONTEND_URL')}/payments"

            # Prepare message variables
            variables = {
                "tenant_name": f"{tenant.first_name} {tenant.last_name}",
                "amount": f"KES {transaction.amount:,.2f}",
                "property_name": lease.unit.property.name,
                "unit_number": lease.unit.unit_number,
                "period": f"{rent_period.period_start_date.strftime('%d %b %Y')} - {rent_period.period_end_date.strftime('%d %b %Y')}",
                "balance": f"KES {balance:,.2f}",
                "water_bill": f"KES {current_water_bill:,.2f}",
                "payment_link": payment_link,
            }

            # Create WhatsApp message
            message = (
                f"📩 Dear {variables['tenant_name']},\n\n"
                f"✅ Payment Received: {variables['amount']}\n"
                f"🏠 {variables['property_name']} - Unit {variables['unit_number']}\n"
                f"📅 Period: {variables['period']}\n"
                f"💧 Water: {variables['water_bill']} ({unit.water_units_used} units)\n"
                f"💰 Balance: {variables['balance']}\n\n"
                f"📱 View Receipt:\n{variables['payment_link']}\n\n"
                f"Thank you! 🙏"
            )

            # Send WhatsApp message with error handling
            try:
                whatsapp_service = WhatsAppService()
                response = whatsapp_service.send_text_message(
                    recipient_number=tenant_phone, message_text=message
                )

                if not response:
                    logger.error(
                        f"WhatsApp service returned empty response for tenant {tenant.id}"
                    )
                    return False

                logger.info(f"WhatsApp receipt sent successfully to tenant {tenant.id}")
                return True

            except Exception as whatsapp_error:
                logger.error(
                    f"WhatsApp sending failed for tenant {tenant.id}: {str(whatsapp_error)}"
                )
                return False

        except Exception as e:
            logger.error(
                f"Error in send_payment_receipt_whatsapp for tenant {getattr(tenant, 'id', 'unknown')}: {str(e)}"
            )
            return False

    def send_tenant_whatsapp(self, tenant_phone: str, tenant_name: str, message: str):
        """Helper method to send WhatsApp message to a single tenant"""
        try:
            print("---i was also called to send---")
            from .utils.send_whatsapp import WhatsAppService

            whatsapp_service = WhatsAppService()
            response = whatsapp_service.send_text_message(
                recipient_number=tenant_phone, message_text=message
            )
            print(response)
            return True, None
        except Exception as e:
            logger.exception(f"WhatsApp sending error: {str(e)}")
            return False, str(e)


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
            # Format: XXX-UnitNumber (First 3 letters of property name + Unit Number)
            try:
                if "-" in account_number:
                    parts = account_number.split("-")
                    if len(parts) != 2:
                        raise ValueError("Invalid format")

                    property_prefix, unit_number = parts

                    # Property prefix should be 3 uppercase letters from property name
                    if not (
                        len(property_prefix) == 3
                        and property_prefix.isalpha()
                        and property_prefix.isupper()
                    ):
                        raise ValueError("Invalid property prefix format")

                    # Find properties that start with this prefix
                    matching_properties = Property.objects.filter(
                        name__istartswith=property_prefix
                    )

                    if not matching_properties.exists():
                        logger.warning(
                            f"No property found with prefix: {property_prefix}"
                        )
                        return Response(
                            {
                                "ResultCode": 1,
                                "ResultDesc": "Rejected - Invalid Property Prefix",
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # Find units with matching unit number in matching properties
                    valid_unit = False
                    has_active_lease = False

                    for property in matching_properties:
                        units = Unit.objects.filter(
                            property=property, unit_number=unit_number
                        )

                        if units.exists():
                            valid_unit = True

                            # Check if there's an active lease
                            active_lease = Lease.objects.filter(
                                unit__in=units, status=LeaseStatus.ACTIVE
                            ).exists()

                            if active_lease:
                                has_active_lease = True
                                break

                    if valid_unit and has_active_lease:
                        logger.info(f"Validated account number: {account_number}")
                        return Response(
                            {"ResultCode": 0, "ResultDesc": "Accepted"},
                            status=status.HTTP_200_OK,
                        )
                    else:
                        reason = (
                            "Invalid Property or Unit"
                            if not valid_unit
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
                            "ResultDesc": "Rejected - Incorrect Format (Expected XXX-UnitNumber)",
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


class MpesaConfirmationAPIView(MpesaBaseView):
    permission_classes = [AllowAny]  # M-Pesa API needs to access this endpoint

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """
        M-Pesa confirmation callback - process the payment immediately
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
            # Convert to Decimal for consistent type handling
            amount = Decimal(str(data.get("TransAmount")))

            # Parse transaction time with timezone awareness
            try:
                naive_datetime = datetime.strptime(
                    data.get("TransTime"), "%Y%m%d%H%M%S"
                )
                # Make it timezone-aware (M-Pesa uses EAT - East Africa Time)
                eat_tz = pytz.timezone("Africa/Nairobi")
                transaction_date = eat_tz.localize(naive_datetime)
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

            # Check if this is a payment link transaction (STK push)
            logger.info(
                f"Checking for STK push payment link - Account: {account_number}"
            )
            payment_link = self._get_payment_link_from_stk_request(transaction)

            if payment_link:
                logger.info(
                    f"Found payment link: {payment_link.id} - Processing as STK push"
                )
                success, tenant, rent_period, lease = (
                    self._process_payment_link_transaction(transaction, payment_link)
                )
            else:
                logger.info(
                    "No payment link found - Processing as regular C2B transaction"
                )
                success, tenant, rent_period, lease = self._process_regular_transaction(
                    transaction
                )

            # Send WhatsApp receipt if payment was successful
            if success and tenant and rent_period and lease:
                try:
                    self.send_payment_receipt_whatsapp(
                        transaction, rent_period, lease, tenant
                    )
                    logger.info(
                        f"WhatsApp receipt sent for transaction {transaction_id}"
                    )
                except Exception as whatsapp_error:
                    logger.error(f"Failed to send WhatsApp receipt: {whatsapp_error}")

            # Log the processing result
            if success:
                logger.info(
                    f"Successfully processed payment for transaction {transaction_id}"
                )
            else:
                logger.warning(
                    f"Payment processing failed for transaction {transaction_id}"
                )

            return Response(
                {"Result Code": 0, "ResultDesc": "Success"}, status=status.HTTP_200_OK
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

    def _get_payment_link_from_stk_request(self, transaction):
        """
        Find payment link by matching recent STK requests
        """
        try:
            from .models import MpesaSTKRequest
            from datetime import timedelta

            # Clean phone number for comparison (remove country code variations)
            transaction_phone = transaction.phone_number.lstrip("+254").lstrip("254")
            if transaction_phone.startswith("0"):
                transaction_phone = transaction_phone[1:]

            # Look for recent STK requests that match this transaction
            recent_time = timezone.now() - timedelta(
                minutes=15
            )  # Within last 15 minutes

            stk_requests = MpesaSTKRequest.objects.filter(
                amount=transaction.amount,
                created_at__gte=recent_time,
                is_processed=False,
            ).select_related("payment_link__lease__unit__property")

            # Try to match by phone number and account number
            for stk_request in stk_requests:
                stk_phone = stk_request.phone_number.lstrip("+254").lstrip("254")
                if stk_phone.startswith("0"):
                    stk_phone = stk_phone[1:]

                if stk_phone == transaction_phone:
                    # Verify the account number matches what we expect
                    property_prefix = stk_request.payment_link.lease.unit.property.name[
                        :3
                    ].upper()
                    unit_number = stk_request.payment_link.lease.unit.unit_number
                    expected_account = f"{property_prefix}-{unit_number}"

                    if transaction.account_number == expected_account:
                        logger.info(
                            f"Found matching STK request: {stk_request.checkout_request_id}"
                        )
                        # Mark as processed
                        stk_request.is_processed = True
                        stk_request.save()
                        return stk_request.payment_link

            logger.info(
                f"No matching STK request found for phone: {transaction_phone}, amount: {transaction.amount}, account: {transaction.account_number}"
            )
            return None

        except Exception as e:
            logger.error(f"Error finding payment link by STK request match: {str(e)}")
            return None

    def _get_payment_link_from_account_number(self, account_number):
        """
        Extract payment link from account number if it's an STK push transaction
        Format: PropertyPrefix-UnitNumber-PaymentLinkID
        """
        try:
            parts = account_number.split("-")
            if len(parts) == 3:  # STK push format
                property_prefix, unit_number, payment_link_id = parts
                try:
                    from .models import (
                        PaymentLink,
                    )  # Import here to avoid circular imports

                    payment_link = PaymentLink.objects.get(
                        id=payment_link_id,
                        lease__unit__unit_number=unit_number,
                        lease__unit__property__name__istartswith=property_prefix,
                    )
                    return payment_link
                except PaymentLink.DoesNotExist:
                    logger.warning(
                        f"Payment link not found for account number: {account_number}"
                    )
                    return None
            return None
        except Exception as e:
            logger.error(
                f"Error extracting payment link from account number {account_number}: {str(e)}"
            )
            return None

    def _process_payment_link_transaction(self, transaction, payment_link):
        """
        Process STK push transaction via payment link
        Returns: (success, tenant, rent_period, lease) tuple
        """
        try:
            lease = payment_link.lease
            unit = lease.unit
            property = unit.property

            # Check if payment link is still valid
            if payment_link.is_expired():
                error_msg = "Payment link has expired"
                transaction.processing_error = error_msg
                transaction.processing_attempts += 1
                transaction.last_attempt = timezone.now()
                transaction.save()
                logger.warning(f"{error_msg}: {payment_link.id}")
                return False, None, None, None

            if payment_link.is_used:
                error_msg = "Payment link has already been used"
                transaction.processing_error = error_msg
                transaction.processing_attempts += 1
                transaction.last_attempt = timezone.now()
                transaction.save()
                logger.warning(f"{error_msg}: {payment_link.id}")
                return False, None, None, None

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

            # If no active rent period, create one
            if not rent_period:
                rent_period = self._create_rent_period(lease)

            if rent_period:
                # Update the rent period with payment
                rent_period.amount_paid += transaction.amount
                rent_period.update_payment_status()

                # Create RentPayment record
                from .models import RentPayment  # Import here to avoid circular imports

                RentPayment.objects.create(
                    lease=lease,
                    amount=transaction.amount,
                    payment_date=transaction.transaction_date.date(),
                    payment_method="MPESA",
                    transaction_id=transaction.transaction_id,
                    notes=f"STK Push Payment via Payment Link {payment_link.id}",
                )

                # Mark payment link as used if payment covers the amount due
                current_balance = rent_period.amount_due - rent_period.amount_paid
                if current_balance <= 0:
                    payment_link.is_used = True
                    payment_link.save()
                    logger.info(f"Payment link {payment_link.id} marked as used")

                # Update transaction with references
                transaction.property = property
                transaction.unit = unit
                transaction.tenant = lease.tenant
                transaction.rent_period = rent_period
                transaction.processed = True
                transaction.save()

                logger.info(
                    f"Successfully processed STK push payment for {lease.tenant} - Unit {unit.unit_number}"
                )

                # Create next period if current one is fully paid
                if rent_period.is_paid:
                    self._create_next_rent_period_if_needed(lease, rent_period)

                return True, lease.tenant, rent_period, lease
            else:
                error_msg = "Failed to create or find rent period for this lease"
                transaction.processing_error = error_msg
                transaction.processing_attempts += 1
                transaction.last_attempt = timezone.now()
                transaction.save()
                logger.warning(f"{error_msg}: {lease}")
                return False, None, None, None

        except Exception as e:
            error_msg = f"Error processing STK push payment: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.exception(error_msg)
            return False, None, None, None

    def _process_regular_transaction(self, transaction):
        """
        Process regular C2B transaction (same as the original _process_payment method)
        Returns: (success, tenant, rent_period, lease) tuple
        """
        try:
            # Parse account number to get property and unit
            if "-" in transaction.account_number:
                parts = transaction.account_number.split("-")
                if len(parts) != 2:
                    raise ValueError("Invalid account number format")

                property_prefix, unit_number = parts

                # Property prefix should be 3 uppercase letters
                if not (
                    len(property_prefix) == 3
                    and property_prefix.isalpha()
                    and property_prefix.isupper()
                ):
                    raise ValueError("Invalid property prefix format")

                # Find matching properties (those that start with this prefix)
                matching_properties = Property.objects.filter(
                    name__istartswith=property_prefix
                )

                if not matching_properties.exists():
                    raise Property.DoesNotExist(
                        f"No property found with prefix: {property_prefix}"
                    )

                # Find matching unit and property combination
                found_unit = None
                found_property = None

                for property in matching_properties:
                    try:
                        unit = Unit.objects.get(
                            property=property, unit_number=unit_number
                        )
                        found_unit = unit
                        found_property = property
                        break
                    except Unit.DoesNotExist:
                        continue

                if not found_unit or not found_property:
                    raise Unit.DoesNotExist(
                        f"No unit {unit_number} found in properties with prefix {property_prefix}"
                    )

                # Use the found property and unit
                property = found_property
                unit = found_unit

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

                    # If no active rent period, create one
                    if not rent_period:
                        rent_period = self._create_rent_period(lease)

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
                            f"Successfully processed C2B payment for {lease.tenant} - Unit {unit.unit_number}"
                        )

                        # Create next period if current one is fully paid
                        if rent_period.is_paid:
                            self._create_next_rent_period_if_needed(lease, rent_period)

                        return True, lease.tenant, rent_period, lease
                    else:
                        error_msg = (
                            "Failed to create or find rent period for this lease"
                        )
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

            return False, None, None, None

        except (Property.DoesNotExist, Unit.DoesNotExist) as e:
            error_msg = f"Property or Unit not found: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.error(error_msg)
            return False, None, None, None

        except Exception as e:
            error_msg = f"Error processing C2B payment: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.exception(error_msg)
            return False, None, None, None

    def _create_rent_period(self, lease):
        """Create a new rent period for the lease"""
        try:
            from dateutil.relativedelta import relativedelta

            today = timezone.now().date()
            period_start_date = today.replace(day=1)  # First day of current month

            # Calculate end date and base rent amount based on payment period
            if lease.payment_period == PaymentPeriod.MONTHLY:
                next_month = period_start_date + relativedelta(months=1)
                period_end_date = next_month - relativedelta(days=1)
                base_amount_due = lease.monthly_rent
            elif lease.payment_period == PaymentPeriod.BIMONTHLY:
                period_end_date = (
                    period_start_date + relativedelta(months=2) - relativedelta(days=1)
                )
                base_amount_due = lease.monthly_rent * 2
            elif lease.payment_period == PaymentPeriod.HALF_YEARLY:
                period_end_date = (
                    period_start_date + relativedelta(months=6) - relativedelta(days=1)
                )
                base_amount_due = lease.monthly_rent * 6
            elif lease.payment_period == PaymentPeriod.YEARLY:
                period_end_date = (
                    period_start_date + relativedelta(years=1) - relativedelta(days=1)
                )
                base_amount_due = lease.monthly_rent * 12
            else:
                # Default to monthly if unexpected payment period
                next_month = period_start_date + relativedelta(months=1)
                period_end_date = next_month - relativedelta(days=1)
                base_amount_due = lease.monthly_rent

            # Get water bill information for this period
            unit = lease.unit
            unit.reset_water_units_if_needed()
            water_bill_amount = unit.get_current_water_bill()
            water_units_used = unit.water_units_used

            # Create the new rent period with water bill included in amount_due
            rent_period = RentPeriodStatus.objects.create(
                lease=lease,
                period_start_date=period_start_date,
                period_end_date=period_end_date,
                amount_due=base_amount_due + water_bill_amount,
                amount_paid=0,
                is_paid=False,
                water_bill_amount=water_bill_amount,
                water_units_used=water_units_used,
            )

            logger.info(
                f"Created new rent period for lease {lease.id}: {period_start_date} to {period_end_date}"
            )
            return rent_period

        except Exception as e:
            logger.error(f"Error creating rent period for lease {lease.id}: {str(e)}")
            return None

    def _create_next_rent_period_if_needed(self, lease, current_period):
        """Create next rent period if current one is fully paid"""
        try:
            from dateutil.relativedelta import relativedelta

            # Calculate next period based on current period's end date
            next_period_start = current_period.period_end_date + relativedelta(days=1)

            # Check if next period already exists
            next_period_exists = RentPeriodStatus.objects.filter(
                lease=lease, period_start_date=next_period_start
            ).exists()

            if not next_period_exists:
                # Calculate next period end date based on payment period
                if lease.payment_period == PaymentPeriod.MONTHLY:
                    next_period_end = (
                        next_period_start
                        + relativedelta(months=1)
                        - relativedelta(days=1)
                    )
                    next_amount_due = lease.monthly_rent
                elif lease.payment_period == PaymentPeriod.BIMONTHLY:
                    next_period_end = (
                        next_period_start
                        + relativedelta(months=2)
                        - relativedelta(days=1)
                    )
                    next_amount_due = lease.monthly_rent * 2
                elif lease.payment_period == PaymentPeriod.HALF_YEARLY:
                    next_period_end = (
                        next_period_start
                        + relativedelta(months=6)
                        - relativedelta(days=1)
                    )
                    next_amount_due = lease.monthly_rent * 6
                elif lease.payment_period == PaymentPeriod.YEARLY:
                    next_period_end = (
                        next_period_start
                        + relativedelta(years=1)
                        - relativedelta(days=1)
                    )
                    next_amount_due = lease.monthly_rent * 12
                else:
                    # Default to monthly
                    next_period_end = (
                        next_period_start
                        + relativedelta(months=1)
                        - relativedelta(days=1)
                    )
                    next_amount_due = lease.monthly_rent

                # Create next period
                RentPeriodStatus.objects.create(
                    lease=lease,
                    period_start_date=next_period_start,
                    period_end_date=next_period_end,
                    amount_due=next_amount_due,
                    amount_paid=0,
                    is_paid=False,
                )

                logger.info(
                    f"Created next rent period for lease {lease.id}: {next_period_start} to {next_period_end}"
                )
        except Exception as e:
            logger.error(
                f"Error creating next rent period for lease {lease.id}: {str(e)}"
            )


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


class MpesaSimulatePaymentView(MpesaBaseView):
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

            # For simulation, we'll manually process the payment since the callback might not work
            # Generate a transaction ID for the simulated payment
            transaction_id = result.get(
                "OriginatorConversationID", f"SIM-{timezone.now().timestamp()}"
            )

            # Create transaction record for the simulation
            transaction = MpesaTransaction.objects.create(
                transaction_id=transaction_id,
                phone_number=phone_number,
                amount=float(amount),
                account_number=account_number,
                transaction_date=timezone.now(),
            )

            # Process the payment immediately
            success, tenant, rent_period, lease = self._process_payment(transaction)

            # Send WhatsApp receipt if successful
            if success and tenant and rent_period and lease:
                # Process in background thread to avoid delaying the response
                threading.Thread(
                    target=self.send_payment_receipt_whatsapp,
                    args=(transaction, rent_period, lease, tenant),
                ).start()

                # Update the result with additional information
                result.update(
                    {
                        "payment_processed": True,
                        "receipt_sent": True,
                        "tenant_name": f"{tenant.first_name} {tenant.last_name}",
                        "unit_number": lease.unit.unit_number,
                        "property_name": lease.unit.property.name,
                        "rent_status": "FULLY PAID"
                        if rent_period.is_paid
                        else "PARTIALLY PAID",
                        "amount_paid": str(rent_period.amount_paid),
                        "amount_due": str(rent_period.amount_due),
                    }
                )
            else:
                result.update(
                    {
                        "payment_processed": False,
                        "error": transaction.processing_error,
                    }
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

    def _process_payment(self, transaction):
        """
        Process simulated payment
        This implements the account number format logic
        Returns: (success, tenant, rent_period, lease) tuple
        """
        try:
            # Parse account number to get property and unit
            if "-" in transaction.account_number:
                parts = transaction.account_number.split("-")
                if len(parts) != 2:
                    raise ValueError("Invalid account number format")

                property_prefix, unit_number = parts

                # Property prefix should be 3 uppercase letters
                if not (
                    len(property_prefix) == 3
                    and property_prefix.isalpha()
                    and property_prefix.isupper()
                ):
                    raise ValueError("Invalid property prefix format")

                # Find matching properties (those that start with this prefix)
                matching_properties = Property.objects.filter(
                    name__istartswith=property_prefix
                )

                if not matching_properties.exists():
                    raise Property.DoesNotExist(
                        f"No property found with prefix: {property_prefix}"
                    )

                # Find matching unit and property combination
                found_unit = None
                found_property = None

                for property in matching_properties:
                    try:
                        unit = Unit.objects.get(
                            property=property, unit_number=unit_number
                        )
                        found_unit = unit
                        found_property = property
                        break
                    except Unit.DoesNotExist:
                        continue

                if not found_unit or not found_property:
                    raise Unit.DoesNotExist(
                        f"No unit {unit_number} found in properties with prefix {property_prefix}"
                    )

                # Use the found property and unit
                property = found_property
                unit = found_unit

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

                    # If no active rent period, create one
                    if not rent_period:
                        # Determine current period dates based on lease payment period
                        today = timezone.now().date()
                        period_start_date = today.replace(
                            day=1
                        )  # First day of current month

                        # Calculate end date based on payment period
                        if lease.payment_period == PaymentPeriod.MONTHLY:
                            # Last day of current month
                            next_month = period_start_date + relativedelta(months=1)
                            period_end_date = next_month - relativedelta(days=1)
                            amount_due = lease.monthly_rent
                        elif lease.payment_period == PaymentPeriod.BIMONTHLY:
                            period_end_date = (
                                period_start_date
                                + relativedelta(months=2)
                                - relativedelta(days=1)
                            )
                            amount_due = lease.monthly_rent * 2
                        elif lease.payment_period == PaymentPeriod.HALF_YEARLY:
                            period_end_date = (
                                period_start_date
                                + relativedelta(months=6)
                                - relativedelta(days=1)
                            )
                            amount_due = lease.monthly_rent * 6
                        elif lease.payment_period == PaymentPeriod.YEARLY:
                            period_end_date = (
                                period_start_date
                                + relativedelta(years=1)
                                - relativedelta(days=1)
                            )
                            amount_due = lease.monthly_rent * 12
                        else:
                            # Default to monthly if unexpected payment period
                            next_month = period_start_date + relativedelta(months=1)
                            period_end_date = next_month - relativedelta(days=1)
                            amount_due = lease.monthly_rent

                        # Create the new rent period
                        rent_period = RentPeriodStatus.objects.create(
                            lease=lease,
                            period_start_date=period_start_date,
                            period_end_date=period_end_date,
                            amount_due=amount_due,
                            amount_paid=0,
                            is_paid=False,
                        )

                        logger.info(
                            f"Created new rent period for lease {lease.id}: {period_start_date} to {period_end_date}"
                        )

                    # Now we should have a rent period - proceed with payment
                    if rent_period:
                        # Convert transaction amount to Decimal to match rent_period.amount_paid
                        from decimal import Decimal

                        # Update the rent period with payment (fix for type mismatch)
                        amount_to_add = Decimal(str(transaction.amount))
                        logger.info(
                            f"Adding payment amount {amount_to_add} to current amount_paid {rent_period.amount_paid}"
                        )

                        rent_period.amount_paid += amount_to_add
                        rent_period.update_payment_status()

                        logger.info(
                            f"Updated rent period amount_paid to {rent_period.amount_paid}"
                        )

                        # Create RentPayment record
                        RentPayment.objects.create(
                            lease=lease,
                            amount=amount_to_add,  # Use the decimal amount here too
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

                        # Check if the rent period is now fully paid and create next period if needed
                        if rent_period.is_paid:
                            # Calculate next period based on current period's end date
                            next_period_start = (
                                rent_period.period_end_date + relativedelta(days=1)
                            )

                            # Check if next period already exists
                            next_period_exists = RentPeriodStatus.objects.filter(
                                lease=lease, period_start_date=next_period_start
                            ).exists()

                            if not next_period_exists:
                                # Calculate next period end date based on payment period
                                if lease.payment_period == PaymentPeriod.MONTHLY:
                                    next_period_end = (
                                        next_period_start
                                        + relativedelta(months=1)
                                        - relativedelta(days=1)
                                    )
                                    next_amount_due = lease.monthly_rent
                                elif lease.payment_period == PaymentPeriod.BIMONTHLY:
                                    next_period_end = (
                                        next_period_start
                                        + relativedelta(months=2)
                                        - relativedelta(days=1)
                                    )
                                    next_amount_due = lease.monthly_rent * 2
                                elif lease.payment_period == PaymentPeriod.HALF_YEARLY:
                                    next_period_end = (
                                        next_period_start
                                        + relativedelta(months=6)
                                        - relativedelta(days=1)
                                    )
                                    next_amount_due = lease.monthly_rent * 6
                                elif lease.payment_period == PaymentPeriod.YEARLY:
                                    next_period_end = (
                                        next_period_start
                                        + relativedelta(years=1)
                                        - relativedelta(days=1)
                                    )
                                    next_amount_due = lease.monthly_rent * 12
                                else:
                                    # Default to monthly
                                    next_period_end = (
                                        next_period_start
                                        + relativedelta(months=1)
                                        - relativedelta(days=1)
                                    )
                                    next_amount_due = lease.monthly_rent

                                # Create next period
                                RentPeriodStatus.objects.create(
                                    lease=lease,
                                    period_start_date=next_period_start,
                                    period_end_date=next_period_end,
                                    amount_due=next_amount_due,
                                    amount_paid=0,
                                    is_paid=False,
                                )

                                logger.info(
                                    f"Created next rent period for lease {lease.id}: {next_period_start} to {next_period_end}"
                                )

                        return True, lease.tenant, rent_period, lease
                    else:
                        error_msg = (
                            "Failed to create or find rent period for this lease"
                        )
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

            return False, None, None, None

        except (Property.DoesNotExist, Unit.DoesNotExist) as e:
            error_msg = f"Property or Unit not found: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.error(error_msg)
            return False, None, None, None

        except Exception as e:
            error_msg = f"Error processing payment: {str(e)}"
            transaction.processing_error = error_msg
            transaction.processing_attempts += 1
            transaction.last_attempt = timezone.now()
            transaction.save()
            logger.exception(error_msg)
            return False, None, None, None


class PaymentReceiptView(APIView):
    """
    Retrieve payment receipt data using short code
    """

    permission_classes = []  # Public endpoint

    def get(self, request, code):
        """Serve payment receipt data"""
        try:
            # Validate code format
            if not code or len(code) != 6:
                return Response(
                    {
                        "error": "Invalid receipt code format",
                        "message": "Receipt code must be 6 characters long",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get receipt
            try:
                receipt = PaymentReceipt.objects.get(code=code.upper())
            except PaymentReceipt.DoesNotExist:
                logger.warning(f"Receipt not found for code: {code}")
                return Response(
                    {
                        "error": "Receipt not found",
                        "message": "The receipt link you are looking for does not exist or may have been removed.",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check if expired
            if timezone.now() > receipt.expires_at:
                logger.info(f"Expired receipt access attempt for code: {code}")
                return Response(
                    {
                        "error": "Receipt expired",
                        "message": "This receipt link has expired. Please contact support for assistance.",
                        "expired_at": receipt.expires_at.isoformat(),
                    },
                    status=status.HTTP_410_GONE,
                )

            # Increment access count (with error handling)
            try:
                receipt.accessed_count += 1
                receipt.save(update_fields=["accessed_count"])
            except Exception as e:
                logger.warning(
                    f"Failed to update access count for receipt {code}: {str(e)}"
                )
                # Don't fail the request if we can't update access count

            # Return payment data
            return Response(
                {
                    "success": True,
                    "data": receipt.payment_data,
                    "meta": {
                        "accessed_count": receipt.accessed_count,
                        "created_at": receipt.created_at.isoformat(),
                        "expires_at": receipt.expires_at.isoformat(),
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Unexpected error retrieving receipt {code}: {str(e)}")
            return Response(
                {
                    "error": "Internal server error",
                    "message": "An unexpected error occurred while retrieving the receipt. Please try again later.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
