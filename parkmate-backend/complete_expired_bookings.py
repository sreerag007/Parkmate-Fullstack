#!/usr/bin/env python
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from django.utils import timezone

# Get all ACTIVE bookings with end_time in the past
expired_active = Booking.objects.filter(
    status='ACTIVE',
    end_time__lte=timezone.now()
)

print(f"Found {expired_active.count()} expired ACTIVE bookings")

for booking in expired_active:
    print(f"\n✅ Completing Booking {booking.booking_id}")
    print(f"   End time: {booking.end_time}")
    print(f"   Current time: {timezone.now()}")
    
    booking.status = 'COMPLETED'
    booking.slot.is_available = True
    
    # Auto-clear carwash services
    carwash_services = booking.booking_by_user.all()
    if carwash_services.exists():
        print(f"   Removing {carwash_services.count()} carwash service(s)")
        carwash_services.delete()
    
    booking.slot.save()
    booking.save()
    
    print(f"   ✓ Status: ACTIVE → COMPLETED")
    print(f"   ✓ Slot {booking.slot.slot_id} marked available")

print("\n✅ All expired ACTIVE bookings completed")
