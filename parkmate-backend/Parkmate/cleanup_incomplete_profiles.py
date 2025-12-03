# Database Cleanup Script - Remove Incomplete Owner and User Profiles

from parking.models import OwnerProfile, UserProfile

print("=" * 60)
print("DATABASE CLEANUP - REMOVING INCOMPLETE PROFILES")
print("=" * 60)

# Clean up incomplete Owner Profiles
print("\n1. Checking Owner Profiles...")
incomplete_owners = OwnerProfile.objects.filter(
    firstname__isnull=True
) | OwnerProfile.objects.filter(
    firstname__exact=''
) | OwnerProfile.objects.filter(
    lastname__isnull=True
) | OwnerProfile.objects.filter(
    lastname__exact=''
) | OwnerProfile.objects.filter(
    city__isnull=True
) | OwnerProfile.objects.filter(
    city__exact=''
)

print("   Found " + str(incomplete_owners.count()) + " incomplete owner profiles")

if incomplete_owners.count() > 0:
    print("\n   Incomplete owners to be deleted:")
    for owner in incomplete_owners:
        fname = owner.firstname or 'NULL'
        lname = owner.lastname or 'NULL'
        c = owner.city or 'NULL'
        print("   - ID " + str(owner.id) + ": " + fname + " " + lname + " | City: " + c)
    
    # Auto-delete without confirmation in script
    deleted_count = incomplete_owners.count()
    incomplete_owners.delete()
    print("   Deleted " + str(deleted_count) + " incomplete owner profiles")
else:
    print("   No incomplete owner profiles found")

# Clean up incomplete User Profiles
print("\n2. Checking User Profiles...")
incomplete_users = UserProfile.objects.filter(
    firstname__isnull=True
) | UserProfile.objects.filter(
    firstname__exact=''
) | UserProfile.objects.filter(
    lastname__isnull=True
) | UserProfile.objects.filter(
    lastname__exact=''
)

print("   Found " + str(incomplete_users.count()) + " incomplete user profiles")

if incomplete_users.count() > 0:
    print("\n   Incomplete users to be deleted:")
    for user in incomplete_users:
        fname = user.firstname or 'NULL'
        lname = user.lastname or 'NULL'
        ph = user.phone or 'NULL'
        print("   - ID " + str(user.id) + ": " + fname + " " + lname + " | Phone: " + ph)
    
    # Auto-delete without confirmation
    deleted_count = incomplete_users.count()
    incomplete_users.delete()
    print("   Deleted " + str(deleted_count) + " incomplete user profiles")
else:
    print("   No incomplete user profiles found")

# Summary
print("\n" + "=" * 60)
print("CLEANUP COMPLETE")
print("=" * 60)

# Show remaining counts
total_owners = OwnerProfile.objects.count()
total_users = UserProfile.objects.count()
print("\nRemaining profiles:")
print("   Owners: " + str(total_owners))
print("   Users: " + str(total_users))

