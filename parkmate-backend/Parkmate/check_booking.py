import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import CarWashBooking

try:
    booking = CarWashBooking.objects.get(carwash_booking_id=31)
    print("=" * 50)
    print("BOOKING #31 DETAILS")
    print("=" * 50)
    print(f"User: {booking.user.firstname} {booking.user.lastname}")
    print(f"User ID: {booking.user.id}")
    print(f"Phone: {booking.user.phone}")
    print("-" * 50)
    if booking.lot:
        print(f"Lot Name: {booking.lot.lot_name}")
        print(f"Lot ID: {booking.lot.lot_id}")
        print(f"City: {booking.lot.city}")
    else:
        print("Lot: No lot assigned")
    print("-" * 50)
    print(f"Service Type: {booking.service_type}")
    print(f"Price: ₹{booking.price}")
    print(f"Status: {booking.status}")
    print(f"Payment Status: {booking.payment_status}")
    print(f"Payment Method: {booking.payment_method}")
    print(f"Transaction ID: {booking.transaction_id or 'N/A'}")
    print(f"Scheduled Time: {booking.scheduled_time}")
    print(f"Booking Time: {booking.booking_time}")
    print("=" * 50)
except CarWashBooking.DoesNotExist:
    print("Booking #31 not found!")
