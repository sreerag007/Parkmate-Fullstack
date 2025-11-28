#!/usr/bin/env python
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from django.utils import timezone

# Get all SCHEDULED bookings with start_time in the past
scheduled = Booking.objects.filter(
    status='SCHEDULED',
    start_time__lte=timezone.now()
)

print(f"Found {scheduled.count()} SCHEDULED bookings with start_time in the past")

for booking in scheduled:
    print(f"\n✅ Transitioning Booking {booking.booking_id} from SCHEDULED to ACTIVE")
    print(f"   Start time: {booking.start_time}")
    print(f"   Current time: {timezone.now()}")
    
    booking.status = 'ACTIVE'
    booking.slot.is_available = False
    booking.slot.save()
    booking.save()
    
    print(f"   ✓ Status: SCHEDULED → ACTIVE")
    print(f"   ✓ Slot {booking.slot.slot_id} marked unavailable")

print("\n✅ All SCHEDULED bookings transitioned to ACTIVE")
