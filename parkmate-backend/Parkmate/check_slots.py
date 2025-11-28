import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot

slots = P_Slot.objects.filter(is_available=True)[:3]
print("Available slots:")
for s in slots:
    print(f"  Slot {s.slot_id}: available=True")
