# tasks.py
import logging
from datetime import datetime
from django.utils import timezone
from celery import shared_task
from api.models import (
    MpesaTransaction,
    Property,
    Unit,
    Lease,
    LeaseStatus,
    RentPeriodStatus,
    RentPayment,
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_rent_payment(self, transaction_id):
    """
    Process a rent payment transaction asynchronously
    """
    logger.info(f"Processing M-Pesa transaction {transaction_id}")

    try:
        # Fetch transaction and lock it
        transaction = MpesaTransaction.objects.select_for_update().get(
            id=transaction_id
        )

        # Skip if already processed
        if transaction.processed:
            logger.info(f"Transaction {transaction_id} already processed, skipping")
            return True

        # Update attempt counter
        transaction.processing_attempts += 1
        transaction.last_attempt = timezone.now()
        transaction.save(update_fields=["processing_attempts", "last_attempt"])

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
                    transaction.save(update_fields=["processing_error"])
                    logger.warning(f"{error_msg}: {lease}")
            else:
                error_msg = "No active lease found for this unit"
                transaction.processing_error = error_msg
                transaction.save(update_fields=["processing_error"])
                logger.warning(f"{error_msg}: {unit}")
        else:
            error_msg = "Invalid account number format"
            transaction.processing_error = error_msg
            transaction.save(update_fields=["processing_error"])
            logger.warning(f"{error_msg}: {transaction.account_number}")

        # If we reach here, something went wrong
        if self.request.retries < self.max_retries:
            logger.info(
                f"Retrying transaction {transaction_id}, attempt {self.request.retries + 1}"
            )
            raise self.retry(countdown=300)  # Retry after 5 minutes

        return False

    except (Property.DoesNotExist, Unit.DoesNotExist) as e:
        error_msg = f"Property or Unit not found: {str(e)}"
        try:
            transaction = MpesaTransaction.objects.get(id=transaction_id)
            transaction.processing_error = error_msg
            transaction.save(update_fields=["processing_error"])
        except:
            pass
        logger.error(error_msg)

        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300)
        return False

    except MpesaTransaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found")
        return False

    except Exception as e:
        error_msg = f"Error processing payment: {str(e)}"
        try:
            transaction = MpesaTransaction.objects.get(id=transaction_id)
            transaction.processing_error = error_msg
            transaction.save(update_fields=["processing_error"])
        except:
            pass
        logger.exception(error_msg)

        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300)
        return False
