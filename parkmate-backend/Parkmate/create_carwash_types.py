import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Carwash_type

count = Carwash_type.objects.count()
print(f'Existing carwash types: {count}')

if count == 0:
    Carwash_type.objects.create(
        name='Interior Wash',
        description='Thorough vacuuming, wipe down, and interior detailing',
        price=500.00
    )
    Carwash_type.objects.create(
        name='Exterior Wash',
        description='Exterior shampoo, wheel clean and rim shine',
        price=300.00
    )
    Carwash_type.objects.create(
        name='Full Wash',
        description='Interior + Exterior combo for a complete clean',
        price=750.00
    )
    print('Created 3 carwash types')

print('\nAll carwash types:')
for c in Carwash_type.objects.all():
    print(f'  - {c.name}: Rs.{c.price} - {c.description}')
