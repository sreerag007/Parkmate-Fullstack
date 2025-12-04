import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Employee
import json

print("\n=== EMPLOYEE LICENSE IMAGES ===\n")
employees = Employee.objects.all()

for emp in employees:
    print(f"Employee: {emp.firstname} {emp.lastname}")
    print(f"License: {emp.driving_license}")
    print(f"Image field value: {emp.driving_license_image}")
    print(f"Image field bool: {bool(emp.driving_license_image)}")
    if emp.driving_license_image:
        print(f"Image name: {emp.driving_license_image.name}")
        print(f"Image path: {emp.driving_license_image.path if hasattr(emp.driving_license_image, 'path') else 'N/A'}")
        print(f"Image URL: {emp.driving_license_image.url if hasattr(emp.driving_license_image, 'url') else 'N/A'}")
    print("-" * 60)
