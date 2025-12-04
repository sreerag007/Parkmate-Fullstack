"""
Fix employee workload counters based on actual active car wash bookings
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Employee, CarWashBooking

print("\n" + "="*60)
print("🔧 FIXING EMPLOYEE WORKLOAD COUNTERS")
print("="*60)

# Get all employees
employees = Employee.objects.all()

for employee in employees:
    # Count active car wash bookings (not completed, not cancelled)
    active_bookings = CarWashBooking.objects.filter(
        employee=employee,
        status__in=['pending', 'confirmed', 'in_progress']
    ).count()
    
    old_count = employee.current_assignments
    employee.current_assignments = active_bookings
    
    # Update availability status
    if active_bookings >= 3:
        employee.availability_status = 'busy'
    else:
        employee.availability_status = 'available'
    
    employee.save()
    
    print(f"\n👤 {employee.firstname} {employee.lastname} (ID: {employee.employee_id})")
    print(f"   Old count: {old_count}")
    print(f"   Active bookings: {active_bookings}")
    print(f"   New count: {employee.current_assignments}")
    print(f"   Status: {employee.availability_status}")

print("\n" + "="*60)
print("✅ EMPLOYEE WORKLOAD FIXED")
print("="*60 + "\n")
