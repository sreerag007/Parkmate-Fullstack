#!/usr/bin/env python
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from django.utils import timezone

# Update booking 68 to ACTIVE status
b = Booking.objects.get(booking_id=68)
print(f"Booking 68 before update:")
print(f"  Status: {b.status}")
print(f"  End time: {b.end_time}")
print(f"  Remaining: {(b.end_time - timezone.now()).total_seconds()} seconds")

b.status = 'ACTIVE'
b.save()

print(f"\n✅ Updated booking 68 to ACTIVE status")
print(f"Booking 68 after update:")
print(f"  Status: {b.status}")
