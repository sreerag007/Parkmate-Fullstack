"""
Sync employee workload counters with actual active assignments
Counts BOTH standalone and add-on car wash services
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Employee, CarWashBooking, Carwash

def sync_all_employees():
    """Sync workload for all employees"""
    employees = Employee.objects.all()
    
    print(f"\n{'='*60}")
    print(f"🔄 SYNCING EMPLOYEE WORKLOAD COUNTERS")
    print(f"{'='*60}\n")
    
    for employee in employees:
        print(f"👤 {employee.firstname} {employee.lastname} (ID: {employee.employee_id})")
        
        old_count = employee.current_assignments
        
        # Count active STANDALONE car wash bookings
        standalone_count = CarWashBooking.objects.filter(
            employee=employee,
            status__in=['pending', 'confirmed', 'in_progress']
        ).count()
        
        # Count active ADD-ON car wash services (via Carwash model)
        # These are active if their associated booking is not completed/cancelled
        addon_count = Carwash.objects.filter(
            employee=employee,
            booking__status__in=['booked', 'active']  # Active booking statuses
        ).count()
        
        total_active = standalone_count + addon_count
        
        print(f"   Old workload: {old_count}")
        print(f"   Standalone bookings: {standalone_count}")
        print(f"   Add-on services: {addon_count}")
        print(f"   Total active: {total_active}")
        
        # Update employee
        employee.current_assignments = total_active
        
        # Update availability status
        if total_active >= 3:
            employee.availability_status = 'busy'
        elif total_active > 0:
            employee.availability_status = 'available'
        else:
            employee.availability_status = 'available'
        
        employee.save()
        
        print(f"   ✅ Updated: {old_count} → {total_active}")
        print(f"   Status: {employee.availability_status}")
        print()
    
    print(f"{'='*60}")
    print(f"✅ SYNC COMPLETE - All {employees.count()} employees updated")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    sync_all_employees()
