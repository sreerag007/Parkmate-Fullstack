import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import VEHICLE_CHOICES

print("\n=== VEHICLE_CHOICES in models.py ===")
for choice in VEHICLE_CHOICES:
    print(f"  {choice[0]} -> {choice[1]}")

print("\n=== Testing serializer validation ===")
from parking.serializers import UserRegisterSerializer

# Test if Multi-Axle is accepted
test_data = {
    'username': 'testuser',
    'email': 'test@test.com',
    'password': 'testpass123',
    'firstname': 'Test',
    'lastname': 'User',
    'phone': '1234567890',
    'vehicle_number': 'KL-08-AZ-1234',
    'vehicle_type': 'Multi-Axle'
}

serializer = UserRegisterSerializer(data=test_data)
if serializer.is_valid():
    print("✅ Multi-Axle is VALID")
else:
    print("❌ Multi-Axle is INVALID")
    print(f"Errors: {serializer.errors}")

# Test if SUV is still accepted (should fail)
test_data_suv = test_data.copy()
test_data_suv['vehicle_type'] = 'SUV'
test_data_suv['username'] = 'testuser2'

serializer_suv = UserRegisterSerializer(data=test_data_suv)
if serializer_suv.is_valid():
    print("⚠️  SUV is still VALID (unexpected!)")
else:
    print("✅ SUV is INVALID (expected)")
    print(f"Errors: {serializer_suv.errors}")
