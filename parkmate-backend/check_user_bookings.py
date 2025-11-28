#!/usr/bin/env python
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking, UserProfile

u = UserProfile.objects.filter(firstname='Updateddd').first()
if u:
    bookings = Booking.objects.filter(user=u)
    print(f'User: {u.firstname} {u.lastname}')
    print(f'Total bookings: {bookings.count()}')
    for b in bookings:
        print(f'  Booking {b.booking_id}: {b.status}, slot={b.slot.slot_id}, end={b.end_time}')
else:
    print("User 'Updateddd' not found")
