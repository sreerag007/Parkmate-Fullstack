"""
Django signals for triggering WebSocket notifications.
These signals listen to model changes and send real-time notifications to users.

Events:
5. Slot Auto-Expired → User
6. Booking Declined by Admin → User
7. Cash Payment Verified → User
8. New Booking Created → Owner
9. Car Wash Completed → User
10. Owner Assigned New Employee → Owner
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from parking.notification_utils import send_ws_notification
import logging

logger = logging.getLogger(__name__)

# Import models - use string references to avoid circular imports
from parking.models import Booking, Payment, Carwash

# Signal receivers for notifications


@receiver(post_save, sender=Booking)
def booking_status_changed(sender, instance, created, **kwargs):
    """
    Listen for Booking model changes and trigger notifications.
    Handles: Slot auto-expired, Booking declined by admin, New booking created
    """
    try:
        # Event 5: Slot Auto-Expired (booking status changed to completed and expired)
        if instance.status.upper() == "COMPLETED":
            # Check if end_time has passed
            if instance.end_time and timezone.now() > instance.end_time:
                send_ws_notification(
                    instance.user.id,
                    "warning",
                    f"Your booking for Slot #{instance.slot.slot_id} has expired."
                )
                logger.info(f"✅ Sent auto-expired notification for booking {instance.booking_id}")

        # Event 6: Booking Declined by Admin
        if instance.status.upper() == "CANCELLED_BY_ADMIN":
            send_ws_notification(
                instance.user.id,
                "warning",
                "Admin declined your booking request."
            )
            logger.info(f"✅ Sent admin declined notification for booking {instance.booking_id}")

        # Event 8: New Booking Created (notify owner)
        if created:
            # Send to owner
            if instance.lot and instance.lot.owner:
                send_ws_notification(
                    instance.lot.owner.auth_user.id,
                    "info",
                    f"New booking received for Lot #{instance.lot.lot_id}."
                )
                logger.info(f"✅ Sent new booking notification to owner {instance.lot.owner.auth_user.id}")

    except Exception as e:
        logger.error(f"❌ Error in booking_status_changed signal: {str(e)}")


@receiver(post_save, sender=Payment)
def payment_status_changed(sender, instance, **kwargs):
    """
    Listen for Payment model changes.
    Handles: Cash payment verified
    """
    try:
        # Event 7: Cash Payment Verified
        if (instance.method.upper() == "CASH" and 
            instance.status.upper() == "VERIFIED"):
            
            if instance.booking and instance.booking.user:
                send_ws_notification(
                    instance.booking.user.id,
                    "success",
                    "Your cash payment has been verified. Booking activated!"
                )
                logger.info(f"✅ Sent payment verified notification for payment {instance.payment_id}")

    except Exception as e:
        logger.error(f"❌ Error in payment_status_changed signal: {str(e)}")


@receiver(post_save, sender=Carwash)
def carwash_status_changed(sender, instance, **kwargs):
    """
    Listen for Carwash model changes.
    Handles: Car wash completed
    """
    try:
        # Event 9: Car Wash Completed
        if instance.status.upper() == "COMPLETED":
            
            if instance.booking and instance.booking.user:
                send_ws_notification(
                    instance.booking.user.id,
                    "success",
                    "Your car wash service has been completed!"
                )
                logger.info(f"✅ Sent carwash completed notification for booking {instance.booking.booking_id}")

    except Exception as e:
        logger.error(f"❌ Error in carwash_status_changed signal: {str(e)}")


# Signal for Event 10: Owner Assigned New Employee
# This requires importing EmployeeAssignment which may not exist yet
# Uncomment when EmployeeAssignment model is available

# @receiver(post_save, sender=EmployeeAssignment)
# def employee_assigned(sender, instance, created, **kwargs):
#     """
#     Listen for new employee assignments.
#     Handles: Owner assigned new employee
#     """
#     try:
#         if created:
#             send_ws_notification(
#                 instance.owner.auth_user.id,
#                 "info",
#                 f"New employee '{instance.employee.name}' has been assigned to your lot."
#             )
#     except Exception as e:
#         logger.error(f"❌ Error in employee_assigned signal: {str(e)}")
