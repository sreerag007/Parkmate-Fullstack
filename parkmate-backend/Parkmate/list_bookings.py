import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import CarWashBooking

bookings = CarWashBooking.objects.all().order_by('-carwash_booking_id')[:10]

print("=" * 80)
print("RECENT CAR WASH BOOKINGS (Last 10)")
print("=" * 80)

if bookings:
    for booking in bookings:
        print(f"\nBooking #{booking.carwash_booking_id}")
        print(f"  User: {booking.user.firstname} {booking.user.lastname} (ID: {booking.user.id})")
        print(f"  Lot: {booking.lot.lot_name if booking.lot else 'No lot'} (ID: {booking.lot.lot_id if booking.lot else 'N/A'})")
        print(f"  Service: {booking.service_type}")
        print(f"  Status: {booking.status} | Payment: {booking.payment_status}")
        print(f"  Method: {booking.payment_method} | Transaction ID: {booking.transaction_id or 'N/A'}")
        print(f"  Scheduled: {booking.scheduled_time}")
        print("-" * 80)
else:
    print("No car wash bookings found!")

print(f"\nTotal bookings: {CarWashBooking.objects.count()}")
