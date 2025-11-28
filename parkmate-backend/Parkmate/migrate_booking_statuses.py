#!/usr/bin/env python
"""Migrate booking statuses to lowercase for consistency"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Parkmate.settings")
django.setup()

from parking.models import Booking

print("="*70)
print("BOOKING STATUS MIGRATION TO LOWERCASE")
print("="*70)

# Find all bookings with uppercase statuses
uppercase_statuses = {
    'COMPLETED': 'completed',
    'ACTIVE': 'booked',
    'CANCELLED': 'cancelled',
    'SCHEDULED': 'booked'
}

print("\n📋 Scanning for uppercase status values...")
count_updated = 0

for old_status, new_status in uppercase_statuses.items():
    bookings = Booking.objects.filter(status=old_status)
    if bookings.exists():
        count = bookings.count()
        print(f"\n  Found {count} bookings with status='{old_status}'")
        print(f"  Converting to '{new_status}'...")
        
        for booking in bookings:
            booking.status = new_status
            booking.save()
            print(f"    ✓ Booking {booking.booking_id}: {old_status} → {new_status}")
            count_updated += 1

# Verify
print("\n" + "="*70)
print("✅ MIGRATION COMPLETE")
print(f"   Updated {count_updated} bookings to lowercase status values")
print("="*70)

# Check final distribution
print("\n📊 Final booking status distribution:")
booked_count = Booking.objects.filter(status='booked').count()
completed_count = Booking.objects.filter(status='completed').count()
cancelled_count = Booking.objects.filter(status='cancelled').count()
total = Booking.objects.count()

print(f"  Total bookings: {total}")
print(f"  - booked: {booked_count}")
print(f"  - completed: {completed_count}")
print(f"  - cancelled: {cancelled_count}")

# Verify no invalid statuses remain
invalid = Booking.objects.exclude(status__in=['booked', 'completed', 'cancelled'])
if invalid.exists():
    print(f"\n⚠️  WARNING: {invalid.count()} bookings still have invalid statuses:")
    for booking in invalid[:5]:
        print(f"   - Booking {booking.booking_id}: status='{booking.status}'")
else:
    print(f"\n✅ All booking statuses are now consistent (lowercase)")
