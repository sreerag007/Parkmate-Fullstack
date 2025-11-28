#!/usr/bin/env python
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from django.utils import timezone
from parking.models import Booking

now = timezone.now()
print(f'Current time (UTC): {now}')
print(f'Current time ISO: {now.isoformat()}')

b = Booking.objects.get(booking_id=67)
print(f'\nBooking 67:')
print(f'  start_time: {b.start_time}')
print(f'  end_time: {b.end_time}')
print(f'  is_expired: {b.is_expired()}')
print(f'  end_time > now: {b.end_time > now}')
print(f'  Remaining: {(b.end_time - now).total_seconds()} seconds')
