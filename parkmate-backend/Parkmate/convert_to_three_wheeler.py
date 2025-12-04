import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot
from decimal import Decimal

print("\n=== Converting Sedan Slots to Three-Wheeler ===")
print("-" * 60)

# Get some sedan slots to convert (let's convert 10 sedan slots)
sedan_slots = P_Slot.objects.filter(vehicle_type='Sedan', is_available=True)[:10]

converted_count = 0
for slot in sedan_slots:
    lot_name = slot.lot.lot_name
    slot_id = slot.slot_id
    
    # Update to Three-Wheeler with ₹20 price
    slot.vehicle_type = 'Three-Wheeler'
    slot.price = Decimal('20.00')
    slot.save()
    
    converted_count += 1
    print(f"✅ Converted Slot #{slot_id} @ {lot_name}: Sedan → Three-Wheeler (₹20.00)")

print(f"\n{'='*60}")
print(f"Total converted: {converted_count} slots")

# Show updated counts
print("\n=== Updated Vehicle Type Distribution ===")
print("-" * 60)
for vehicle_type in ['Hatchback', 'Sedan', 'Multi-Axle', 'Three-Wheeler', 'Two-Wheeler']:
    count = P_Slot.objects.filter(vehicle_type=vehicle_type).count()
    if count > 0:
        slots = P_Slot.objects.filter(vehicle_type=vehicle_type)
        prices = set(slots.values_list('price', flat=True))
        price_str = ', '.join([f'₹{p}' for p in sorted(prices)])
        print(f"{vehicle_type}: {count} slots @ {price_str}")

print("=" * 60)
