import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot
from decimal import Decimal

# Define pricing based on vehicle type
pricing = {
    'Sedan': Decimal('50.00'),
    'Hatchback': Decimal('50.00'),
    'Multi-Axle': Decimal('50.00'),
    'Three-Wheeler': Decimal('20.00'),
    'Two-Wheeler': Decimal('10.00')
}

print("Updating slot prices based on vehicle type...")
print("-" * 60)

for vehicle_type, price in pricing.items():
    slots = P_Slot.objects.filter(vehicle_type=vehicle_type)
    count = slots.count()
    if count > 0:
        updated = slots.update(price=price)
        print(f"✅ {vehicle_type}: Updated {updated} slots to Rs.{price}")
    else:
        print(f"⚠️  {vehicle_type}: No slots found")

print("-" * 60)
print("Summary of current pricing:")
from django.db.models import Count
result = P_Slot.objects.values('vehicle_type', 'price').annotate(count=Count('slot_id')).order_by('vehicle_type')
for r in result:
    print(f"  {r['vehicle_type']}: Rs.{r['price']} ({r['count']} slots)")

print("\n✅ Slot pricing updated successfully!")
