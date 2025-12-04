import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Employee, OwnerProfile
from parking.serializers import EmployeeSerializer

print("\n=== SIMULATING API RESPONSE ===\n")

# Get all employees as the API would return them
employees = Employee.objects.all()
serializer = EmployeeSerializer(employees, many=True)
api_data = serializer.data

print("API Response (JSON):")
print(json.dumps(api_data, indent=2))

print("\n=== CHECKING OWNER VALUES ===\n")
for emp_data in api_data:
    print(f"Employee: {emp_data['firstname']} {emp_data['lastname']}")
    print(f"  owner field: {emp_data['owner']}")
    print(f"  owner type: {type(emp_data['owner'])}")
    print(f"  owner is None: {emp_data['owner'] is None}")
    print(f"  owner == null: {emp_data['owner'] == None}")
    print("-" * 50)
