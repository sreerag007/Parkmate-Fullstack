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

Additionally handles:
- Employee workload counter synchronization for car wash bookings
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.db import transaction
from parking.notification_utils import send_ws_notification
import logging

logger = logging.getLogger(__name__)

# Import models - use string references to avoid circular imports
from parking.models import Booking, Payment, Carwash, CarWashBooking, Employee

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


# ============================================================
# EMPLOYEE WORKLOAD SYNCHRONIZATION SIGNALS
# ============================================================

def recalculate_employee_workload(employee):
    """
    Recalculate employee workload from scratch based on actual active assignments.
    This ensures consistency even if increment/decrement logic has bugs.
    
    Returns the employee with updated workload (not saved yet).
    """
    if not employee:
        return None
    
    # Count active STANDALONE car wash bookings
    standalone_count = CarWashBooking.objects.filter(
        employee=employee,
        status__in=['pending', 'confirmed', 'in_progress']
    ).count()
    
    # Count active ADD-ON car wash services
    addon_count = Carwash.objects.filter(
        employee=employee,
        booking__status__in=['booked', 'active']
    ).count()
    
    total_active = standalone_count + addon_count
    
    # Update employee
    old_count = employee.current_assignments
    employee.current_assignments = total_active
    
    # Update availability status
    if total_active >= 3:
        employee.availability_status = 'busy'
    else:
        employee.availability_status = 'available'
    
    if old_count != total_active:
        logger.info(f"🔄 Recalculated workload for {employee.firstname} {employee.lastname}: {old_count} → {total_active}")
    
    return employee


@receiver(post_save, sender=CarWashBooking)
def sync_employee_workload_on_carwash_save(sender, instance, created, **kwargs):
    """
    Sync employee workload when CarWashBooking is created or updated.
    This ensures consistency by recalculating from actual data.
    """
    if instance.employee:
        try:
            with transaction.atomic():
                employee = Employee.objects.select_for_update().get(pk=instance.employee.pk)
                recalculated = recalculate_employee_workload(employee)
                if recalculated:
                    recalculated.save()
        except Employee.DoesNotExist:
            logger.warning(f"Employee {instance.employee.pk} not found during workload sync")


@receiver(post_delete, sender=CarWashBooking)
def sync_employee_workload_on_carwash_delete(sender, instance, **kwargs):
    """
    Sync employee workload when CarWashBooking is deleted.
    """
    if instance.employee:
        try:
            with transaction.atomic():
                employee = Employee.objects.select_for_update().get(pk=instance.employee.pk)
                recalculated = recalculate_employee_workload(employee)
                if recalculated:
                    recalculated.save()
        except Employee.DoesNotExist:
            logger.warning(f"Employee {instance.employee.pk} not found during workload sync")


@receiver(post_save, sender=Carwash)
def sync_employee_workload_on_addon_save(sender, instance, created, **kwargs):
    """
    Sync employee workload when add-on Carwash is created or updated.
    """
    if instance.employee:
        try:
            with transaction.atomic():
                employee = Employee.objects.select_for_update().get(pk=instance.employee.pk)
                recalculated = recalculate_employee_workload(employee)
                if recalculated:
                    recalculated.save()
        except Employee.DoesNotExist:
            logger.warning(f"Employee {instance.employee.pk} not found during workload sync")


@receiver(post_delete, sender=Carwash)
def sync_employee_workload_on_addon_delete(sender, instance, **kwargs):
    """
    Sync employee workload when add-on Carwash is deleted.
    """
    if instance.employee:
        try:
            with transaction.atomic():
                employee = Employee.objects.select_for_update().get(pk=instance.employee.pk)
                recalculated = recalculate_employee_workload(employee)
                if recalculated:
                    recalculated.save()
        except Employee.DoesNotExist:
            logger.warning(f"Employee {instance.employee.pk} not found during workload sync")


@receiver(pre_save, sender=CarWashBooking)
def handle_employee_reassignment(sender, instance, **kwargs):
    """
    Handle employee reassignment: recalculate both old and new employee workloads.
    """
    if instance.pk:  # Only for updates, not creates
        try:
            old_instance = CarWashBooking.objects.get(pk=instance.pk)
            old_employee = old_instance.employee
            new_employee = instance.employee
            
            # If employee changed, recalculate both
            if old_employee and new_employee and old_employee.pk != new_employee.pk:
                logger.info(f"🔄 Employee reassignment: {old_employee} → {new_employee}")
                
                # Recalculate old employee (after the save completes)
                # This will be handled by post_save signal
                
        except CarWashBooking.DoesNotExist:
            pass


@receiver(pre_save, sender=Carwash)
def handle_addon_employee_reassignment(sender, instance, **kwargs):
    """
    Handle employee reassignment for add-on car wash services.
    """
    if instance.pk:  # Only for updates, not creates
        try:
            old_instance = Carwash.objects.get(pk=instance.pk)
            old_employee = old_instance.employee
            new_employee = instance.employee
            
            # If employee changed, also sync the old employee
            if old_employee and new_employee and old_employee.pk != new_employee.pk:
                logger.info(f"🔄 Add-on employee reassignment: {old_employee} → {new_employee}")
                
                # Sync old employee (new employee will be synced by post_save)
                with transaction.atomic():
                    old_emp = Employee.objects.select_for_update().get(pk=old_employee.pk)
                    recalculated = recalculate_employee_workload(old_emp)
                    if recalculated:
                        recalculated.save()
                        
        except Carwash.DoesNotExist:
            pass

