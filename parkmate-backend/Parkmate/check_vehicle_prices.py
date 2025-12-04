import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot, Carwash_type, CarWashService
from decimal import Decimal

print("\n=== PARKING SLOT PRICES BY VEHICLE TYPE ===")
print("-" * 60)

for vehicle_type in ['Hatchback', 'Sedan', 'Multi-Axle', 'Three-Wheeler', 'Two-Wheeler']:
    slots = P_Slot.objects.filter(vehicle_type=vehicle_type)
    if slots.exists():
        prices = slots.values_list('price', flat=True).distinct()
        count = slots.count()
        print(f"\n{vehicle_type}:")
        print(f"  Total slots: {count}")
        print(f"  Price(s): {', '.join([f'₹{p}' for p in prices])}")
        
        # Show sample slots
        sample_slots = slots[:3]
        for slot in sample_slots:
            print(f"    - Slot #{slot.slot_id} @ {slot.lot.lot_name}: ₹{slot.price}")
    else:
        print(f"\n{vehicle_type}: No slots found")

print("\n" + "=" * 60)
print("\n=== CAR WASH SERVICE PRICES ===")
print("-" * 60)

carwash_services = CarWashService.objects.filter(is_active=True)
if carwash_services.exists():
    for service in carwash_services:
        print(f"\n{service.service_name} ({service.service_type}):")
        print(f"  Base Price: ₹{service.base_price}")
        print(f"  Duration: {service.estimated_duration} mins")
        print(f"  Description: {service.description}")
else:
    print("\nNo car wash services found")

print("\n" + "=" * 60)
