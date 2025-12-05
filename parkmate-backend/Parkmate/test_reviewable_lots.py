#!/usr/bin/env python
"""Test script to verify reviewable lots include both slot and carwash bookings"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import UserProfile, Booking, CarWashBooking, P_Lot, AuthUser

print("\n" + "="*60)
print("TESTING REVIEWABLE LOTS LOGIC")
print("="*60)

# Find a user with bookings
try:
    # Get first user profile
    user_profile = UserProfile.objects.first()
    if not user_profile:
        print("❌ No user profiles found in database")
        sys.exit(1)
    
    print(f"\n✅ Testing with user: {user_profile.firstname} {user_profile.lastname} (ID: {user_profile.id})")
    
    # Check slot bookings
    slot_bookings = Booking.objects.filter(
        user=user_profile,
        status__iexact='completed'
    )
    slot_lot_ids = set(slot_bookings.values_list('lot_id', flat=True))
    
    print(f"\n📦 SLOT BOOKINGS:")
    print(f"   Total completed: {slot_bookings.count()}")
    print(f"   Unique lots: {len(slot_lot_ids)}")
    if slot_lot_ids:
        for lot_id in slot_lot_ids:
            lot = P_Lot.objects.get(lot_id=lot_id)
            print(f"     - Lot {lot_id}: {lot.lot_name}")
    
    # Check carwash bookings
    carwash_bookings = CarWashBooking.objects.filter(
        user=user_profile,
        status='completed',
        lot__isnull=False
    )
    carwash_lot_ids = set(carwash_bookings.values_list('lot_id', flat=True))
    
    print(f"\n🧼 CARWASH BOOKINGS:")
    print(f"   Total completed: {carwash_bookings.count()}")
    print(f"   Unique lots: {len(carwash_lot_ids)}")
    if carwash_lot_ids:
        for lot_id in carwash_lot_ids:
            lot = P_Lot.objects.get(lot_id=lot_id)
            print(f"     - Lot {lot_id}: {lot.lot_name}")
    
    # Combined (what the API will return)
    combined_lot_ids = slot_lot_ids | carwash_lot_ids
    
    print(f"\n✅ COMBINED REVIEWABLE LOTS:")
    print(f"   Total unique lots: {len(combined_lot_ids)}")
    if combined_lot_ids:
        lots = P_Lot.objects.filter(lot_id__in=list(combined_lot_ids))
        for lot in lots:
            in_slot = "✓" if lot.lot_id in slot_lot_ids else " "
            in_carwash = "✓" if lot.lot_id in carwash_lot_ids else " "
            print(f"     [{in_slot}] Slot  [{in_carwash}] Carwash  →  Lot {lot.lot_id}: {lot.lot_name}")
    else:
        print("     (No completed bookings found)")
    
    print(f"\n{'='*60}")
    print("✅ TEST COMPLETE")
    print("="*60 + "\n")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
