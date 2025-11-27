#!/usr/bin/env python
import os
import sys
import django

# Add the Parkmate directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/Parkmate')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import AuthUser, OwnerProfile
from rest_framework.authtoken.models import Token

# Update existing owner with known password
print("📝 Updating existing owners with test password...")
for owner_username in ['kuttapanthrikoor', 'BobSapp', 'Mehrouf', 'Jeswin']:
    try:
        owner = AuthUser.objects.get(username=owner_username)
        owner.set_password('testpass123')
        owner.save()
        print(f"✅ Updated {owner_username} password to: testpass123")
    except AuthUser.DoesNotExist:
        print(f"❌ Owner {owner_username} not found")

# Also create a new test owner
print("\n📝 Creating new test owner...")
AuthUser.objects.filter(username='testowner').delete()

auth_user = AuthUser.objects.create_user(
    username='testowner',
    password='testpass123',
    role='Owner'
)

owner_profile = OwnerProfile.objects.create(
    auth_user=auth_user,
    firstname='Test',
    lastname='Owner',
    phone='9999999999',
    streetname='Test Street',
    locality='Test Locality',
    city='Test City',
    state='Test State',
    pincode='123456',
    verification_status='APPROVED'
)

token, _ = Token.objects.get_or_create(user=auth_user)

print(f"✅ Test Owner Created!")
print(f"Username: testowner")
print(f"Password: testpass123")
print(f"Role: {auth_user.role}")
print(f"Owner ID: {owner_profile.id}")

print("\n🔐 All owners can now login with password: testpass123")
