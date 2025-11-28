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

# Delete old booking 67
try:
    old_booking = Booking.objects.get(booking_id=67)
    slot_id = old_booking.slot.slot_id
    old_booking.delete()
    # Mark slot as available again
    slot = P_Slot.objects.get(slot_id=slot_id)
    slot.is_available = True
    slot.save()
    print(f"✅ Deleted old booking 67")
except:
    pass

# Get a user and an available slot
user = UserProfile.objects.filter(firstname='Updateddd').first()
slot = P_Slot.objects.filter(is_available=True).first()

if not user or not slot:
    print("❌ Could not find user or available slot")
    sys.exit(1)

# Create a new ACTIVE booking with 1 hour duration (in UTC now)
now = timezone.now()  # This will be UTC
start_time = now
end_time = now + timedelta(hours=1)

booking = Booking.objects.create(
    user=user,
    slot=slot,
    lot=slot.lot,
    vehicle_number='TEST-TIMER-UTC',
    booking_type='instant',
    status='ACTIVE',
    start_time=start_time,
    end_time=end_time,
    price=slot.price
)

# Mark slot as unavailable
slot.is_available = False
slot.save()

print(f"✅ Created fresh ACTIVE booking {booking.booking_id}")
print(f"   User: {user.firstname}")
print(f"   Slot: {slot.slot_id}")
print(f"   Start (UTC): {start_time.isoformat()}")
print(f"   End (UTC): {end_time.isoformat()}")
print(f"   Duration: 1 hour")
print(f"   Status: ACTIVE")
print(f"\n✅ Now the timer should display correctly!")
print(f"   Expected display: ~59:59 countdown")
