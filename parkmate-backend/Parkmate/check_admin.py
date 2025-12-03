import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import AuthUser

admin = AuthUser.objects.filter(is_superuser=True).first()
if admin:
    print(f'Admin User: {admin.username}')
    print(f'Role: {admin.role}')
    print(f'Is Superuser: {admin.is_superuser}')
else:
    print('No admin user found')

# Check all users with is_staff
staff = AuthUser.objects.filter(is_staff=True)
print(f'\nStaff Users: {staff.count()}')
for u in staff:
    print(f'  - {u.username}: role={u.role}, is_superuser={u.is_superuser}')
