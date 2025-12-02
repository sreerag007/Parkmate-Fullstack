#!/usr/bin/env python
"""
Clean up test bookings from the database to allow fresh testing.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import CarWashBooking
from django.utils import timezone
from datetime import datetime, timedelta

print("\n" + "="*80)
print("🗑️ CLEANING UP TEST CAR WASH BOOKINGS")
print("="*80 + "\n")

# Get all test bookings from testing
bookings_to_delete = CarWashBooking.objects.filter(
    scheduled_time__gte=timezone.now() - timedelta(days=1),
    scheduled_time__lte=timezone.now() + timedelta(days=1),
    status__in=['pending', 'verified']
).exclude(user__auth_user__username='test_customer')

print(f"📊 Found {bookings_to_delete.count()} test bookings to delete\n")

if bookings_to_delete.exists():
    print("Bookings to be deleted:")
    print("-" * 80)
    
    for booking in bookings_to_delete:
        print(f"\n❌ Booking #{booking.carwash_booking_id}")
        print(f"   Scheduled: {booking.scheduled_time}")
        print(f"   Service: {booking.service_type}")
        print(f"   Lot: {booking.lot.lot_name if booking.lot else 'None'}")
        print(f"   Status: {booking.status}")
    
    # Delete
    count = bookings_to_delete.count()
    bookings_to_delete.delete()
    print(f"\n\n✅ Deleted {count} test bookings\n")
else:
    print("✅ No test bookings to delete\n")

# Show remaining bookings
remaining = CarWashBooking.objects.all().order_by('-booking_time')
print(f"\n📊 Remaining bookings: {remaining.count()}\n")

if remaining.exists():
    print("Bookings remaining:")
    print("-" * 80)
    for booking in remaining:
        print(f"\n✓ Booking #{booking.carwash_booking_id}")
        print(f"   Scheduled: {booking.scheduled_time}")
        print(f"   Service: {booking.service_type}")
        print(f"   Lot: {booking.lot.lot_name if booking.lot else 'None'}")
        print(f"   User: {booking.user.firstname if booking.user.firstname else 'Unknown'}")
        print(f"   Status: {booking.status}")

print("\n" + "="*80)
print("Cleanup Complete")
print("="*80 + "\n")
