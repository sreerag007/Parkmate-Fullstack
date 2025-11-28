#!/usr/bin/env python
import os
import django
import sys

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import UserProfile

users = UserProfile.objects.all()
print(f'Total Users: {users.count()}')
for u in users:
    bookings_count = u.bookings.count()
    active_bookings = u.bookings.filter(status='ACTIVE').count()
    if bookings_count > 0:
        print(f'  {u.firstname} {u.lastname}: {bookings_count} bookings ({active_bookings} ACTIVE)')
