"""
Test script to verify vehicle type filtering in slot API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot

print("\n" + "="*70)
print("🧪 TESTING VEHICLE TYPE FILTERING")
print("="*70)

# Test 1: Get all slots
all_slots = P_Slot.objects.all()
print(f"\n✅ Test 1: Get all slots")
print(f"   Total slots: {all_slots.count()}")

# Test 2: Filter by vehicle type (case insensitive)
for vehicle_type in ['Hatchback', 'Sedan', 'Multi-Axle', 'Three-Wheeler', 'Two-Wheeler']:
    slots = P_Slot.objects.filter(vehicle_type__iexact=vehicle_type)
    print(f"\n✅ Test 2: Filter by '{vehicle_type}'")
    print(f"   Found: {slots.count()} slots")
    if slots.exists():
        sample = slots.first()
        print(f"   Sample: Slot #{sample.slot_id} @ {sample.lot.lot_name} - ₹{sample.price}")

# Test 3: Filter by lot_id
lot_id = 1
slots_in_lot = P_Slot.objects.filter(lot__lot_id=lot_id)
print(f"\n✅ Test 3: Filter by lot_id={lot_id}")
print(f"   Found: {slots_in_lot.count()} slots")

# Test 4: Combine filters (lot_id + vehicle_type)
sedan_in_lot1 = P_Slot.objects.filter(lot__lot_id=1, vehicle_type__iexact='Sedan')
print(f"\n✅ Test 4: Filter by lot_id=1 AND vehicle_type='Sedan'")
print(f"   Found: {sedan_in_lot1.count()} slots")

# Test 5: Three-Wheeler filtering
three_wheeler = P_Slot.objects.filter(vehicle_type__iexact='Three-Wheeler')
print(f"\n✅ Test 5: Filter by 'Three-Wheeler'")
print(f"   Found: {three_wheeler.count()} slots")
if three_wheeler.exists():
    for slot in three_wheeler[:5]:
        print(f"   - Slot #{slot.slot_id} @ {slot.lot.lot_name} - ₹{slot.price}")

print("\n" + "="*70)
print("✅ ALL TESTS COMPLETED")
print("="*70 + "\n")
