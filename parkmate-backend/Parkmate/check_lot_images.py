import os
import sys
import django

# Add the project directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Lot

# Check for Breeze lot
breeze_lots = P_Lot.objects.filter(lot_name__icontains='breeze')
print(f"Found {breeze_lots.count()} lots with 'breeze' in name")

for lot in breeze_lots:
    print(f"\nLot: {lot.lot_name}")
    print(f"  ID: {lot.lot_id}")
    print(f"  Lot Image Field Value: {lot.lot_image}")
    print(f"  Lot Image URL: {lot.lot_image.url if lot.lot_image else 'None'}")

# Check all lots
print(f"\n\nAll lots:")
for lot in P_Lot.objects.all():
    print(f"  - {lot.lot_name}: lot_image={lot.lot_image}")
