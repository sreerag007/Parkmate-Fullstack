#!/usr/bin/env python
"""Test script to verify booking creation works"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import AuthUser, UserProfile, Booking, P_Slot, P_Lot
from django.utils import timezone
from datetime import timedelta

print("=" * 60)
print("BOOKING CREATION TEST")
print("=" * 60)

# Create a test user
test_user = AuthUser.objects.filter(username='testuser_booking').first()
if not test_user:
    test_user = AuthUser.objects.create_user(
        username='testuser_booking',
        password='testpass123',
        email='testbooking@test.com',
        role='User'
    )
    print(f"\n✅ Created test user: {test_user.username}")
else:
    print(f"\n✅ Found existing test user: {test_user.username}")

# Create user profile
profile = UserProfile.objects.filter(auth_user=test_user).first()
if not profile:
    profile = UserProfile.objects.create(
        auth_user=test_user,
        firstname='Test',
        lastname='User',
        vehicle_number='TEST123',
        phone='9876543210',
        vehicle_type='Car'
    )
    print(f"✅ Created user profile")
else:
    print(f"✅ Found existing user profile")

# Get a lot
lot = P_Lot.objects.first()
if not lot:
    print("❌ No lots found in database!")
    sys.exit(1)
print(f"✅ Using lot: {lot.lot_name} (ID: {lot.lot_id})")

# Get an available slot
slot = P_Slot.objects.filter(lot=lot, is_available=True).first()
if not slot:
    # Create one if none available
    slot = P_Slot.objects.create(
        lot=lot,
        vehicle_type='Car',
        is_available=True,
        price=50.0
    )
    print(f"✅ Created test slot: Slot {slot.slot_id}")
else:
    print(f"✅ Using available slot: Slot {slot.slot_id}")

# Test instant booking creation
print("\n" + "-" * 60)
print("Testing INSTANT BOOKING creation...")
print("-" * 60)

try:
    from parking.models import Booking
    now = timezone.now()
    end_time = now + timedelta(hours=1)
    
    booking = Booking.objects.create(
        user=profile,
        slot=slot,
        lot=lot,
        vehicle_number='TEST123',
        booking_type='instant',
        start_time=now,
        end_time=end_time,
        status='ACTIVE',
        price=slot.price
    )
    
    print(f"✅ Booking created successfully!")
    print(f"   Booking ID: {booking.booking_id}")
    print(f"   Status: {booking.status}")
    print(f"   Start Time: {booking.start_time}")
    print(f"   End Time: {booking.end_time}")
    print(f"   Duration: {booking.end_time - booking.start_time}")
    
    # Mark slot as unavailable
    slot.is_available = False
    slot.save()
    print(f"✅ Slot marked as unavailable")
    
except Exception as e:
    print(f"❌ Booking creation failed: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED")
print("=" * 60)
