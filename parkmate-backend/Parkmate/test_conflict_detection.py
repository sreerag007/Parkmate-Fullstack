#!/usr/bin/env python
"""
Test car wash booking conflict detection (409 errors).
Verifies that overlapping time slots are properly detected.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from django.test import Client
from rest_framework.authtoken.models import Token
from parking.models import AuthUser, UserProfile, OwnerProfile, P_Lot, CarWashBooking
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
import json

def test_conflict_detection():
    """Test that 409 Conflict is properly returned for overlapping bookings"""
    print("\n" + "="*80)
    print("🔍 TEST: Car Wash Booking Conflict Detection (409 Conflict)")
    print("="*80 + "\n")
    
    client = Client()
    
    # Setup
    print("1️⃣ SETUP: Creating test user and lot")
    print("-" * 80)
    
    user, _ = AuthUser.objects.get_or_create(
        username='conflict_test_user',
        defaults={'role': 'User'}
    )
    user_token, _ = Token.objects.get_or_create(user=user)
    user_profile, _ = UserProfile.objects.get_or_create(auth_user=user)
    
    owner_user, _ = AuthUser.objects.get_or_create(
        username='conflict_test_owner',
        defaults={'role': 'Owner'}
    )
    owner_profile, _ = OwnerProfile.objects.get_or_create(auth_user=owner_user)
    
    lot, _ = P_Lot.objects.get_or_create(
        lot_name='Conflict Test Lot',
        defaults={
            'owner': owner_profile,
            'streetname': 'Test St',
            'city': 'Test City',
            'state': 'Test State',
            'pincode': '123456',
            'total_slots': 10
        }
    )
    
    print(f"✅ User created: {user.username}")
    print(f"✅ Lot created: {lot.lot_name}")
    print()
    
    # Scenario 1: Book first time slot
    print("2️⃣ SCENARIO 1: Book First Time Slot (Should Succeed)")
    print("-" * 80)
    
    # Schedule booking for 2 hours from now
    base_time = timezone.now() + timedelta(hours=2)
    
    payload1 = {
        'service_type': 'Exterior',  # 20-minute service
        'lot': lot.lot_id,
        'scheduled_time': base_time.isoformat(),
        'notes': 'First booking',
        'payment_method': 'Cash',
        'price': str(Decimal('299.00')),
    }
    
    print(f"Booking time: {base_time.isoformat()}")
    print(f"Service: Exterior (20 minutes)")
    
    response = client.post(
        '/api/carwash-bookings/',
        data=json.dumps(payload1),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {user_token.key}'
    )
    
    if response.status_code == 201:
        data = json.loads(response.content.decode())
        booking1_id = data['carwash_booking_id']
        print(f"✅ SUCCESS - Status 201")
        print(f"   Booking ID: {booking1_id}")
        print(f"   Scheduled: {base_time}")
        print()
    else:
        print(f"❌ FAILED - Status {response.status_code}")
        print(f"   Response: {response.content.decode()}")
        return False
    
    # Scenario 2: Try to book overlapping time slot
    print("3️⃣ SCENARIO 2: Book Overlapping Time Slot (Should Fail with 409)")
    print("-" * 80)
    
    # Try to book 10 minutes after first booking starts
    # First booking: base_time to base_time + 20 minutes
    # Second booking: base_time + 10 minutes (OVERLAPS)
    overlap_time = base_time + timedelta(minutes=10)
    
    payload2 = {
        'service_type': 'Exterior',  # 20-minute service
        'lot': lot.lot_id,
        'scheduled_time': overlap_time.isoformat(),
        'notes': 'Overlapping booking',
        'payment_method': 'UPI',
        'price': str(Decimal('299.00')),
    }
    
    print(f"Booking time: {overlap_time.isoformat()}")
    print(f"Service: Exterior (20 minutes)")
    print(f"Expected: 409 Conflict (overlaps with first booking)")
    
    response = client.post(
        '/api/carwash-bookings/',
        data=json.dumps(payload2),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {user_token.key}'
    )
    
    if response.status_code == 409:
        data = json.loads(response.content.decode())
        print(f"✅ SUCCESS - Status 409 (Conflict detected)")
        print(f"   Error: {data['error']}")
        if 'available_from' in data:
            available = data['available_from']
            print(f"   Available from: {available}")
        print()
    else:
        print(f"❌ FAILED - Expected 409, got {response.status_code}")
        print(f"   Response: {response.content.decode()}")
        return False
    
    # Scenario 3: Book after the first booking ends (should succeed)
    print("4️⃣ SCENARIO 3: Book After First Booking Ends (Should Succeed)")
    print("-" * 80)
    
    # First booking ends at base_time + 20 minutes
    # Book at base_time + 20 minutes (no overlap - starts when first ends)
    after_time = base_time + timedelta(minutes=20)
    
    payload3 = {
        'service_type': 'Full Service',  # 50-minute service
        'lot': lot.lot_id,
        'scheduled_time': after_time.isoformat(),
        'notes': 'After first booking',
        'payment_method': 'CC',
        'price': str(Decimal('499.00')),
    }
    
    print(f"Booking time: {after_time.isoformat()}")
    print(f"Service: Full Service (50 minutes)")
    print(f"First booking ends at: {(base_time + timedelta(minutes=20)).isoformat()}")
    
    response = client.post(
        '/api/carwash-bookings/',
        data=json.dumps(payload3),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {user_token.key}'
    )
    
    if response.status_code == 201:
        data = json.loads(response.content.decode())
        booking3_id = data['carwash_booking_id']
        print(f"✅ SUCCESS - Status 201")
        print(f"   Booking ID: {booking3_id}")
        print(f"   Scheduled: {after_time}")
        print()
    else:
        print(f"❌ FAILED - Status {response.status_code}")
        print(f"   Response: {response.content.decode()}")
        return False
    
    # Scenario 4: Verify bookings in database
    print("5️⃣ VERIFICATION: Check Bookings in Database")
    print("-" * 80)
    
    bookings = CarWashBooking.objects.filter(lot=lot).order_by('scheduled_time')
    print(f"Total bookings for lot: {bookings.count()}\n")
    
    for i, booking in enumerate(bookings, 1):
        duration = 20 if booking.service_type == 'Exterior' else 50 if booking.service_type == 'Full Service' else 30
        end_time = booking.scheduled_time + timedelta(minutes=duration)
        print(f"Booking {i}: #{booking.carwash_booking_id}")
        print(f"  Service: {booking.service_type} ({duration} min)")
        print(f"  Start: {booking.scheduled_time}")
        print(f"  End:   {end_time}")
        print(f"  Status: {booking.status}")
        print()
    
    # Final result
    print("="*80)
    print("✅ CONFLICT DETECTION TEST PASSED")
    print("="*80 + "\n")
    print("Summary:")
    print("  ✅ First booking created successfully")
    print("  ✅ Overlapping booking rejected with 409 Conflict")
    print("  ✅ Non-overlapping booking created successfully")
    print("  ✅ Bookings properly stored in database\n")
    
    return True


if __name__ == '__main__':
    result = test_conflict_detection()
    sys.exit(0 if result else 1)
