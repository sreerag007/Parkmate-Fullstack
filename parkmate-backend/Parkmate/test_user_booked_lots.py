# Test script to check user_booked_lots endpoint logic

from parking.models import Booking, UserProfile, P_Lot, AuthUser

# Get testuser
try:
    auth_user = AuthUser.objects.get(username='testuser')
    print("Found user: " + auth_user.username)
    
    # Get user profile
    user_profile = UserProfile.objects.get(auth_user=auth_user)
    print("Found user profile ID: " + str(user_profile.id))
    
    # Get ALL bookings for this user
    all_bookings = Booking.objects.filter(user=user_profile)
    print("\nTotal bookings: " + str(all_bookings.count()))
    
    for booking in all_bookings:
        print("  Booking " + str(booking.booking_id) + ": Lot '" + booking.lot.lot_name + "' | Status: '" + booking.status + "'")
    
    # Get ONLY completed bookings
    completed_bookings = Booking.objects.filter(
        user=user_profile,
        status__iexact='completed'
    )
    print("\nCompleted bookings: " + str(completed_bookings.count()))
    
    for booking in completed_bookings:
        print("  Booking " + str(booking.booking_id) + ": Lot '" + booking.lot.lot_name + "' | Status: '" + booking.status + "'")
    
    # Extract unique lot IDs
    lot_ids = list(set(completed_bookings.values_list('lot_id', flat=True)))
    print("\nUnique lot IDs with completed bookings: " + str(lot_ids))
    
    # Get lot details
    lots = P_Lot.objects.filter(lot_id__in=lot_ids)
    print("\nLots that should appear in dropdown: " + str(lots.count()))
    for lot in lots:
        print("  " + str(lot.lot_id) + ": " + lot.lot_name)
    
    # Check all lots (for comparison)
    all_lots = P_Lot.objects.all()
    print("\nTotal lots in system: " + str(all_lots.count()))
    for lot in all_lots:
        print("  " + str(lot.lot_id) + ": " + lot.lot_name)
    
except AuthUser.DoesNotExist:
    print("ERROR: User 'testuser' not found")
except UserProfile.DoesNotExist:
    print("ERROR: UserProfile for 'testuser' not found")
except Exception as e:
    print("ERROR: " + str(e))
    import traceback
    traceback.print_exc()
