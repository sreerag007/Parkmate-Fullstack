#!/usr/bin/env python
"""
Debug script to investigate 409 Conflict errors in car wash bookings.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import CarWashBooking, P_Lot, CarWashService
from django.utils import timezone
from datetime import datetime, timedelta

print("\n" + "="*80)
print("🔍 CAR WASH BOOKING - 409 CONFLICT INVESTIGATION")
print("="*80 + "\n")

# Get all car wash bookings
bookings = CarWashBooking.objects.all().order_by('-booking_time')

print(f"📊 Total Car Wash Bookings: {bookings.count()}\n")

if bookings.exists():
    print("📋 Recent Bookings:")
    print("-" * 80)
    
    for booking in bookings[:10]:
        print(f"\nBooking #{booking.carwash_booking_id}:")
        print(f"  Status: {booking.status}")
        print(f"  Payment Status: {booking.payment_status}")
        print(f"  Service: {booking.service_type}")
        print(f"  Lot: {booking.lot.lot_name if booking.lot else 'None'}")
        print(f"  Scheduled: {booking.scheduled_time}")
        print(f"  Created: {booking.booking_time}")
        print(f"  User: {booking.user.firstname} {booking.user.lastname}")
        
        # Check for conflicts
        if booking.scheduled_time:
            scheduled_dt = booking.scheduled_time
            scheduled_end = scheduled_dt + timedelta(minutes=30)
            
            conflicting = CarWashBooking.objects.filter(
                lot_id=booking.lot_id,
                scheduled_time__lt=scheduled_end,
                status__in=['pending', 'confirmed', 'in_progress']
            ).exclude(carwash_booking_id=booking.carwash_booking_id).exclude(status='cancelled')
            
            if conflicting.exists():
                print(f"  ⚠️ CONFLICTS: {conflicting.count()} overlapping booking(s)")
                for cb in conflicting:
                    print(f"     - Booking #{cb.carwash_booking_id} at {cb.scheduled_time}")
            else:
                print(f"  ✅ No conflicts detected")
else:
    print("📭 No car wash bookings found in database")

# Check for upcoming bookings
print("\n\n📅 Upcoming Bookings (Next 24 hours):")
print("-" * 80)

now = timezone.now()
tomorrow = now + timedelta(hours=24)

upcoming = CarWashBooking.objects.filter(
    scheduled_time__gte=now,
    scheduled_time__lte=tomorrow,
    status__in=['pending', 'confirmed', 'in_progress']
).order_by('scheduled_time')

if upcoming.exists():
    for booking in upcoming:
        time_until = booking.scheduled_time - now
        hours = time_until.total_seconds() / 3600
        print(f"\n✓ Booking #{booking.carwash_booking_id}")
        print(f"  Time: {booking.scheduled_time} ({hours:.1f} hours from now)")
        print(f"  Service: {booking.service_type}")
        print(f"  Lot: {booking.lot.lot_name if booking.lot else 'None'}")
        print(f"  User: {booking.user.firstname} {booking.user.lastname}")
else:
    print("\n📭 No upcoming bookings in next 24 hours")

# Check service durations
print("\n\n⏱️ Car Wash Service Durations:")
print("-" * 80)

services = CarWashService.objects.all()
if services.exists():
    for service in services:
        print(f"\n{service.service_name}:")
        print(f"  Duration: {service.estimated_duration} minutes")
        print(f"  Price: ₹{service.base_price}")
else:
    print("\n⚠️ No car wash services defined in database")

print("\n\n" + "="*80)
print("Investigation Complete")
print("="*80 + "\n")
