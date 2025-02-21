import os
import sys
import django
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Q


# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rental.settings")
django.setup()

# Import models after Django setup
from api.utils.send_mail import EmailService
from api.models import Lease, LeaseStatus, RentPeriodStatus

# Configure logging
logging.basicConfig(
    filename="rent_reminder_logs.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class RentReminderService:
    def __init__(self):
        self.email_service = EmailService()
        self.support_email = "support@yourdomain.com"  # Configure your support email

    def send_reminder_email(self, lease, rent_period):
        """Send reminder email to tenant"""
        try:
            context = {
                "tenant_name": f"{lease.tenant.first_name} {lease.tenant.last_name}",
                "property_name": lease.unit.property.name,
                "unit_number": lease.unit.unit_number,
                "amount_due": rent_period.amount_due,
                "due_date": rent_period.period_end_date,
                "days_remaining": (
                    rent_period.period_end_date - datetime.now().date()
                ).days,
            }

            self.email_service.send_email(
                recipient_email=lease.tenant.email,
                recipient_name=f"{lease.tenant.first_name} {lease.tenant.last_name}",
                subject="Important: Rent Payment Reminder",
                template_name="emails/rental_notice.html",
                context=context,
            )

            logger.info(
                f"Reminder email sent successfully to {lease.tenant.email} for lease {lease.id}"
            )

        except Exception as e:
            error_msg = (
                f"Failed to send reminder email to {lease.tenant.email}: {str(e)}"
            )
            logger.error(error_msg)
            self.notify_support("Rent Reminder Email Failure", error_msg)
            raise

    def notify_support(self, subject, error_message):
        """Notify support team about email failures"""
        try:
            context = {
                "error_message": error_message,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            self.email_service.send_email(
                recipient_email=self.support_email,
                recipient_name="Support Team",
                subject=f"[ALERT] {subject}",
                template_name="emails/error_notification.html",
                context=context,
            )

        except Exception as e:
            logger.critical(f"Failed to notify support team: {str(e)}")

    def process_rent_reminders(self):
        """Process rent reminders for all active leases"""
        logger.info("Starting rent reminder processing")

        try:
            # Get active leases with upcoming or overdue rent
            current_date = timezone.now().date()
            active_leases = Lease.objects.filter(
                status=LeaseStatus.ACTIVE
            ).select_related("tenant", "unit__property")

            for lease in active_leases:
                try:
                    # Get unpaid rent periods
                    unpaid_periods = RentPeriodStatus.objects.filter(
                        lease=lease, is_paid=False, period_end_date__gte=current_date
                    )

                    for period in unpaid_periods:
                        days_until_due = (period.period_end_date - current_date).days

                        # Send reminders based on days remaining
                        if days_until_due in [30, 14, 7, 3, 1] or days_until_due < 0:
                            self.send_reminder_email(lease, period)

                except Exception as e:
                    error_msg = f"Error processing lease {lease.id}: {str(e)}"
                    logger.error(error_msg)
                    self.notify_support("Lease Processing Error", error_msg)

        except Exception as e:
            error_msg = f"Critical error in rent reminder processing: {str(e)}"
            logger.critical(error_msg)
            self.notify_support("Critical Processing Error", error_msg)
            raise

        logger.info("Completed rent reminder processing")


def main():
    """Main function to run the rent reminder service"""
    try:
        reminder_service = RentReminderService()
        reminder_service.process_rent_reminders()
    except Exception as e:
        logger.critical(f"Fatal error in rent reminder script: {str(e)}")


if __name__ == "__main__":
    main()
