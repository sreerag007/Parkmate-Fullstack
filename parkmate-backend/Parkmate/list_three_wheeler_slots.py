import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot

print("\n=== THREE-WHEELER PARKING SLOTS ===")
print("-" * 70)

three_wheeler_slots = P_Slot.objects.filter(vehicle_type='Three-Wheeler').order_by('lot__lot_name', 'slot_id')

if three_wheeler_slots.exists():
    current_lot = None
    for slot in three_wheeler_slots:
        if current_lot != slot.lot.lot_name:
            current_lot = slot.lot.lot_name
            print(f"\n📍 {current_lot}")
            print("   " + "-" * 60)
        
        availability = "🟢 Available" if slot.is_available else "🔴 Occupied"
        print(f"   Slot #{slot.slot_id:3d} | ₹{slot.price}/hour | {availability}")
    
    print(f"\n{'='*70}")
    print(f"Total Three-Wheeler Slots: {three_wheeler_slots.count()}")
    available = three_wheeler_slots.filter(is_available=True).count()
    occupied = three_wheeler_slots.filter(is_available=False).count()
    print(f"Available: {available} | Occupied: {occupied}")
else:
    print("No three-wheeler slots found")

print("=" * 70)
