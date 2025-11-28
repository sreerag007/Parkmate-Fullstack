import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()
from parking.models import Booking
bookings = Booking.objects.filter(status='ACTIVE').order_by('-booking_id')[:3]
print("Recent ACTIVE bookings:")
for b in bookings:
    print(f"  {b.booking_id}: {b.user.firstname} - {b.start_time} to {b.end_time}")
