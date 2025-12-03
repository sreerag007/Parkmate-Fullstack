from parking.models import P_Slot, P_Lot
from collections import defaultdict

# Find OLD HOME lot
lot = P_Lot.objects.filter(lot_name__icontains='OLD HOME').first()

if lot:
    print(f"Lot: {lot.lot_name}")
    print(f"Lot ID: {lot.lot_id}")
    print()
    
    # Get all slots for this lot
    slots = P_Slot.objects.filter(lot=lot).order_by('slot_id')
    print(f"Total slots: {slots.count()}")
    print()
    
    # Group by vehicle type
    by_type = defaultdict(list)
    for s in slots:
        by_type[s.vehicle_type].append(s.slot_id)
    
    print("=" * 60)
    print("SLOTS BY VEHICLE TYPE")
    print("=" * 60)
    
    for vtype in sorted(by_type.keys()):
        slot_ids = sorted(by_type[vtype])
        print(f"\n{vtype}:")
        print(f"  Slot IDs: {slot_ids}")
        print(f"  Count: {len(slot_ids)}")
else:
    print("OLD HOME lot not found")
