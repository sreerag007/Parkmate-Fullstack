"""
Script to update user roles to capitalized format
Run this with: python manage.py shell < update_roles.py
"""
from parking.models import AuthUser

# Update all users with lowercase roles to capitalized
users = AuthUser.objects.all()

for user in users:
    if user.role:
        role_lower = user.role.lower()
        if role_lower == 'user':
            user.role = 'User'
        elif role_lower == 'owner':
            user.role = 'Owner'
        elif role_lower == 'admin':
            user.role = 'Admin'
        user.save()
        print(f"Updated {user.username}: {user.role}")
    elif user.is_superuser:
        user.role = 'Admin'
        user.save()
        print(f"Set {user.username} to Admin (was superuser)")

print("\n✅ All user roles updated!")
