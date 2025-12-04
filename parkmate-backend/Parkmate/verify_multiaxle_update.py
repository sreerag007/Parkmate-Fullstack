import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import UserProfile, P_Slot, Booking, VEHICLE_CHOICES

print("=" * 70)
print("VEHICLE TYPE UPDATE VERIFICATION")
print("=" * 70)

# Check VEHICLE_CHOICES
print("\n1. VEHICLE_CHOICES in models.py:")
for choice in VEHICLE_CHOICES:
    print(f"   - {choice[0]}: {choice[1]}")

# Check database records
print("\n2. Database Records:")
print(f"   UserProfiles with 'Multi-Axle': {UserProfile.objects.filter(vehicle_type='Multi-Axle').count()}")
print(f"   UserProfiles with 'SUV': {UserProfile.objects.filter(vehicle_type='SUV').count()}")
print(f"   P_Slots with 'Multi-Axle': {P_Slot.objects.filter(vehicle_type='Multi-Axle').count()}")
print(f"   P_Slots with 'SUV': {P_Slot.objects.filter(vehicle_type='SUV').count()}")
print(f"   Bookings with 'Multi-Axle': {Booking.objects.filter(vehicle_type='Multi-Axle').count()}")
print(f"   Bookings with 'SUV': {Booking.objects.filter(vehicle_type='SUV').count()}")

# Sample Multi-Axle records
print("\n3. Sample Multi-Axle Slots:")
multi_axle_slots = P_Slot.objects.filter(vehicle_type='Multi-Axle')[:5]
for slot in multi_axle_slots:
    print(f"   Slot {slot.slot_id} - {slot.lot.lot_name} - {slot.vehicle_type} - ₹{slot.price}")

print("\n" + "=" * 70)
print("✅ VERIFICATION COMPLETE!")
print("=" * 70)
