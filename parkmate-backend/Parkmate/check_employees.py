import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Employee

print("\n=== ALL EMPLOYEES ===")
employees = Employee.objects.all()
print(f"Total employees: {employees.count()}\n")

for emp in employees:
    print(f"ID: {emp.employee_id}")
    print(f"Name: {emp.firstname} {emp.lastname}")
    print(f"Phone: {emp.phone}")
    print(f"Owner ID: {emp.owner.id if emp.owner else 'None (Unassigned)'}")
    print(f"Owner Name: {emp.owner.firstname if emp.owner else 'N/A'}")
    print("-" * 50)

print("\n=== UNASSIGNED EMPLOYEES (owner is NULL) ===")
unassigned = Employee.objects.filter(owner__isnull=True)
print(f"Total unassigned: {unassigned.count()}\n")

for emp in unassigned:
    print(f"ID: {emp.employee_id}")
    print(f"Name: {emp.firstname} {emp.lastname}")
    print(f"Phone: {emp.phone}")
    print("-" * 50)
