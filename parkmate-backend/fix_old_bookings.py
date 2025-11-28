#!/usr/bin/env python
"""
One-time fix to auto-transition any remaining old SCHEDULED bookings with start_time in the past
"""
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from django.utils import timezone

# Find any remaining SCHEDULED bookings with start_time in the past
old_scheduled = Booking.objects.filter(
    status='SCHEDULED',
    start_time__lte=timezone.now()
)

if old_scheduled.exists():
    print(f"⚠️  Found {old_scheduled.count()} SCHEDULED bookings with start_time in the past!")
    print("🔄 Auto-transitioning them to ACTIVE...")
    
    for booking in old_scheduled:
        print(f"\n✅ Booking {booking.booking_id}")
        booking.status = 'ACTIVE'
        booking.slot.is_available = False
        booking.slot.save()
        booking.save()
else:
    print("✅ No old SCHEDULED bookings found - database is clean!")

# Also auto-complete any ACTIVE bookings with end_time in the past
expired_active = Booking.objects.filter(
    status='ACTIVE',
    end_time__lte=timezone.now()
)

if expired_active.exists():
    print(f"\n⚠️  Found {expired_active.count()} expired ACTIVE bookings!")
    print("🔄 Auto-completing them...")
    
    for booking in expired_active:
        print(f"\n✅ Booking {booking.booking_id}")
        booking.status = 'COMPLETED'
        booking.slot.is_available = True
        
        # Clear carwash services
        carwash_services = booking.booking_by_user.all()
        if carwash_services.exists():
            carwash_services.delete()
        
        booking.slot.save()
        booking.save()
else:
    print("\n✅ No expired ACTIVE bookings found - database is clean!")
