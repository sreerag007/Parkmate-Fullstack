#!/usr/bin/env python
"""Test script to verify booking status consistency"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Parkmate.settings")
django.setup()

from parking.models import Booking

print("="*70)
print("STATUS CONSISTENCY VERIFICATION TEST")
print("="*70)

# Check Booking model STATUS_CHOICES
print("\n✓ Booking Model STATUS_CHOICES:")
for code, display in Booking._meta.get_field('status').choices:
    print(f"  - '{code}' (displays as '{display}')")

# Check that no bookings have uppercase statuses
print("\n✓ Checking database for invalid status values...")
invalid_statuses = Booking.objects.exclude(status__in=['booked', 'completed', 'cancelled'])
if invalid_statuses.exists():
    print(f"  ⚠️  Found {invalid_statuses.count()} bookings with invalid statuses:")
    for booking in invalid_statuses[:5]:
        print(f"     - Booking {booking.booking_id}: status='{booking.status}'")
else:
    print(f"  ✅ All bookings have valid lowercase statuses")

# Check status distribution
print("\n✓ Booking status distribution:")
total = Booking.objects.count()
if total > 0:
    booked_count = Booking.objects.filter(status='booked').count()
    completed_count = Booking.objects.filter(status='completed').count()
    cancelled_count = Booking.objects.filter(status='cancelled').count()
    print(f"  Total bookings: {total}")
    print(f"  - booked: {booked_count} ({int(booked_count/total*100)}%)")
    print(f"  - completed: {completed_count} ({int(completed_count/total*100)}%)")
    print(f"  - cancelled: {cancelled_count} ({int(cancelled_count/total*100)}%)")
else:
    print(f"  (No bookings in database yet)")

print("\n" + "="*70)
print("✅ STATUS VERIFICATION COMPLETE")
print("="*70)
