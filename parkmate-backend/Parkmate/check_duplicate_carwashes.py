#!/usr/bin/env python
"""Check for duplicate carwash bookings"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking, Carwash, P_Slot

print("\n" + "="*60)
print("CHECKING FOR DUPLICATE CARWASH BOOKINGS")
print("="*60)

# Check all active bookings
active_bookings = Booking.objects.filter(status__in=['booked', 'active'])
print(f"\nTotal active bookings: {active_bookings.count()}")

duplicates_found = []

for booking in active_bookings:
    carwashes = Carwash.objects.filter(
        booking=booking,
        status__in=['active', 'pending']
    )
    count = carwashes.count()
    
    if count > 1:
        duplicates_found.append(booking)
        print(f"\n🚨 DUPLICATE FOUND!")
        print(f"   Booking ID: {booking.booking_id}")
        print(f"   Slot: #{booking.slot.slot_id}")
        print(f"   User: {booking.user.firstname} {booking.user.lastname}")
        print(f"   Vehicle: {booking.vehicle_number}")
        print(f"   Active/Pending Carwashes: {count}")
        
        for i, carwash in enumerate(carwashes, 1):
            print(f"\n   Carwash #{i}:")
            print(f"      ID: {carwash.carwash_id}")
            print(f"      Status: {carwash.status}")
            print(f"      Type: {carwash.carwash_type.name}")
            print(f"      Price: ₹{carwash.price}")
            print(f"      Booked at: {carwash.booked_at}")
    elif count == 1:
        carwash = carwashes.first()
        print(f"\n✅ Booking {booking.booking_id} (Slot #{booking.slot.slot_id}): 1 carwash - {carwash.carwash_type.name} ({carwash.status})")

print(f"\n" + "="*60)
if duplicates_found:
    print(f"⚠️  TOTAL DUPLICATES FOUND: {len(duplicates_found)}")
else:
    print("✅ NO DUPLICATES FOUND - All bookings have max 1 carwash")
print("="*60 + "\n")

# Check database constraint
print("\nChecking database constraint:")
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'carwash' 
        AND constraint_name LIKE '%unique%'
    """)
    constraints = cursor.fetchall()
    if constraints:
        for name, ctype in constraints:
            print(f"   ✅ {name} ({ctype})")
    else:
        print("   ❌ No unique constraint found!")
