import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import UserProfile, P_Slot, Booking

# Update UserProfile records
user_count = UserProfile.objects.filter(vehicle_type='SUV').update(vehicle_type='Multi-Axle')
print(f"✅ Updated {user_count} UserProfile records: SUV → Multi-Axle")

# Update P_Slot records
slot_count = P_Slot.objects.filter(vehicle_type='SUV').update(vehicle_type='Multi-Axle')
print(f"✅ Updated {slot_count} P_Slot records: SUV → Multi-Axle")

# Update Booking records
booking_count = Booking.objects.filter(vehicle_type='SUV').update(vehicle_type='Multi-Axle')
print(f"✅ Updated {booking_count} Booking records: SUV → Multi-Axle")

print("\n" + "=" * 60)
print("DATABASE UPDATE COMPLETE!")
print(f"Total records updated: {user_count + slot_count + booking_count}")
print("=" * 60)
