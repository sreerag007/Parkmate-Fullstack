#!/usr/bin/env python
import os
import django
import sys
from datetime import timedelta

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking, P_Slot, UserProfile
from django.utils import timezone

# Get a user and an available slot
user = UserProfile.objects.filter(firstname='Updateddd').first()
slot = P_Slot.objects.filter(is_available=True).first()

if not user or not slot:
    print("❌ Could not find user or available slot")
    sys.exit(1)

# Create a new ACTIVE booking with 1 hour duration
now = timezone.now()
start_time = now
end_time = now + timedelta(hours=1)

booking = Booking.objects.create(
    user=user,
    slot=slot,
    lot=slot.lot,
    vehicle_number='TEST-TIMER',
    booking_type='instant',
    status='ACTIVE',  # Create as ACTIVE directly
    start_time=start_time,
    end_time=end_time,
    price=slot.price
)

# Mark slot as unavailable
slot.is_available = False
slot.save()

print(f"✅ Created ACTIVE booking {booking.booking_id}")
print(f"   User: {user.firstname}")
print(f"   Slot: {slot.slot_id}")
print(f"   Start: {start_time}")
print(f"   End: {end_time}")
print(f"   Duration: 1 hour")
print(f"\n📱 Timer should show ~59:59 on frontend")
