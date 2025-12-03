from parking.models import P_Slot, P_Lot

# Find OLD HOME lot
lot = P_Lot.objects.filter(lot_name__icontains='OLD HOME').first()

if lot:
    print(f"Updating slots for: {lot.lot_name} (ID: {lot.lot_id})")
    print()
    
    # Get all slots for this lot
    slots = list(P_Slot.objects.filter(lot=lot).order_by('slot_id'))
    total = len(slots)
    print(f"Total slots: {total}")
    print()
    
    # Diversify the slots:
    # - 10 Sedan (keep half as Sedan)
    # - 5 Hatchback
    # - 3 Two-Wheeler
    # - 2 SUV
    
    updates = []
    
    # First 10 slots: Sedan (45-54)
    for i in range(10):
        if i < len(slots):
            slots[i].vehicle_type = 'Sedan'
            updates.append(f"Slot {slots[i].slot_id}: Sedan")
    
    # Next 5 slots: Hatchback (55-59 but 57,59 might not exist, so use available)
    for i in range(10, 15):
        if i < len(slots):
            slots[i].vehicle_type = 'Hatchback'
            updates.append(f"Slot {slots[i].slot_id}: Hatchback")
    
    # Next 3 slots: Two-Wheeler
    for i in range(15, 18):
        if i < len(slots):
            slots[i].vehicle_type = 'Two-Wheeler'
            updates.append(f"Slot {slots[i].slot_id}: Two-Wheeler")
    
    # Last 2 slots: SUV
    for i in range(18, 20):
        if i < len(slots):
            slots[i].vehicle_type = 'SUV'
            updates.append(f"Slot {slots[i].slot_id}: SUV")
    
    # Save all changes
    for slot in slots:
        slot.save()
    
    print("Updated slots:")
    for update in updates:
        print(f"  {update}")
    
    print()
    print("=" * 60)
    print("FINAL DISTRIBUTION")
    print("=" * 60)
    
    from collections import Counter
    final_slots = P_Slot.objects.filter(lot=lot)
    counts = Counter([s.vehicle_type for s in final_slots])
    
    for vtype in sorted(counts.keys()):
        slot_ids = sorted([s.slot_id for s in final_slots if s.vehicle_type == vtype])
        print(f"\n{vtype}: {counts[vtype]} slots")
        print(f"  Slot IDs: {slot_ids}")
    
    print()
    print("Successfully diversified OLD HOME lot slots!")
else:
    print("OLD HOME lot not found")
