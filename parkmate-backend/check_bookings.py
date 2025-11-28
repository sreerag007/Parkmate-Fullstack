#!/usr/bin/env python
import os
import django

os.chdir(r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from django.utils import timezone

# Check all bookings grouped by status
statuses = {}
for booking in Booking.objects.all():
    status = booking.status
    if status not in statuses:
        statuses[status] = []
    statuses[status].append({
        'id': booking.booking_id,
        'status': booking.status,
        'end_time': booking.end_time,
        'slot': booking.slot.slot_id if booking.slot else None,
        'user': booking.user.firstname if booking.user else None
    })

print("\n📊 ALL BOOKINGS BY STATUS:")
for status, bookings in sorted(statuses.items()):
    print(f"\n{status}: {len(bookings)} bookings")
    for b in bookings[:3]:  # Show first 3
        now = timezone.now()
        expired = "EXPIRED" if b['end_time'] and b['end_time'] <= now else "ACTIVE"
        print(f"  - Booking {b['id']}: {b['user']} | Slot {b['slot']} | {expired}")
    if len(bookings) > 3:
        print(f"  ... and {len(bookings) - 3} more")
