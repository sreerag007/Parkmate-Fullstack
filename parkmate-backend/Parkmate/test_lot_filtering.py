import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot, P_Lot

print("\n" + "="*70)
print("🧪 TESTING LOT_ID FILTERING")
print("="*70)

# Get all lots
lots = P_Lot.objects.all()[:5]
print(f"\nAvailable lots:")
for lot in lots:
    slot_count = P_Slot.objects.filter(lot=lot).count()
    print(f"  Lot #{lot.lot_id} - {lot.lot_name}: {slot_count} slots")

# Test filtering by lot_id
test_lot_id = 1
print(f"\n🔍 Testing filter: lot__lot_id={test_lot_id}")
slots = P_Slot.objects.filter(lot__lot_id=test_lot_id)
print(f"   Found: {slots.count()} slots")
for slot in slots[:5]:
    print(f"   - Slot #{slot.slot_id}: {slot.vehicle_type} @ {slot.lot.lot_name}")

# Test with lot_id=2
test_lot_id = 2
print(f"\n🔍 Testing filter: lot__lot_id={test_lot_id}")
slots = P_Slot.objects.filter(lot__lot_id=test_lot_id)
print(f"   Found: {slots.count()} slots")
for slot in slots[:5]:
    print(f"   - Slot #{slot.slot_id}: {slot.vehicle_type} @ {slot.lot.lot_name}")

print("\n" + "="*70)
