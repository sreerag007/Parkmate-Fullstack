#!/usr/bin/env python
import os
import sys
import django

# Add the Parkmate directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Parkmate'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from datetime import timedelta

try:
    booking = Booking.objects.get(pk=125)
    print(f"Before update:")
    print(f"  Start: {booking.start_time}")
    print(f"  End: {booking.end_time}")
    print(f"  Duration: {(booking.end_time - booking.start_time).total_seconds()/60:.1f} mins")
    
    # Update to 10 minutes
    booking.end_time = booking.start_time + timedelta(minutes=10)
    booking.save()
    
    print(f"\nAfter update:")
    print(f"  Start: {booking.start_time}")
    print(f"  End: {booking.end_time}")
    print(f"  Duration: {(booking.end_time - booking.start_time).total_seconds()/60:.1f} mins")
    print("\n✅ Booking 125 updated successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
