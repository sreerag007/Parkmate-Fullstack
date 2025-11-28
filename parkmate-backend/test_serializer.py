#!/usr/bin/env python
"""
Test what the BookingSerializer returns for booking 67
"""
import os
import django
import sys
import json

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from parking.serializers import BookingSerializer

booking = Booking.objects.get(booking_id=68)
serializer = BookingSerializer(booking)

print("📊 Serialized Booking 67:")
print(json.dumps(serializer.data, indent=2, default=str))
