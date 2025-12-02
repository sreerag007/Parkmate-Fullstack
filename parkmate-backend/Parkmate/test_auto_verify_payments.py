#!/usr/bin/env python
"""
Test auto-verification of UPI and CC payments on car wash booking creation.
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

def test_payment_auto_verification():
    """Test that UPI and CC payments are auto-verified, while Cash stays pending"""
    print("\n" + "="*80)
    print("🧪 TEST: Auto-Verification of Payment Methods")
    print("="*80 + "\n")
    
    client = Client()
    
    # Setup
    print("1️⃣ SETUP: Creating test user and lot")
    print("-" * 80)
    
    user, _ = AuthUser.objects.get_or_create(
        username='payment_test_user',
        defaults={'role': 'User'}
    )
    user_token, _ = Token.objects.get_or_create(user=user)
    user_profile, _ = UserProfile.objects.get_or_create(auth_user=user)
    
    owner_user, _ = AuthUser.objects.get_or_create(
        username='payment_test_owner',
        defaults={'role': 'Owner'}
    )
    owner_profile, _ = OwnerProfile.objects.get_or_create(auth_user=owner_user)
    
    lot, _ = P_Lot.objects.get_or_create(
        lot_name='Payment Auto-Verify Test Lot',
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
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: UPI payment auto-verification
    print("2️⃣ TEST 1: UPI Payment - Should Auto-Verify")
    print("-" * 80)
    tests_total += 1
    
    base_time = timezone.now() + timedelta(hours=3)
    payload_upi = {
        'service_type': 'Exterior',
        'lot': lot.lot_id,
        'scheduled_time': base_time.isoformat(),
        'notes': 'UPI payment test',
        'payment_method': 'UPI',
        'price': str(Decimal('299.00')),
    }
    
    response = client.post(
        '/api/carwash-bookings/',
        data=json.dumps(payload_upi),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {user_token.key}'
    )
    
    if response.status_code == 201:
        data = json.loads(response.content.decode())
        booking_id = data['carwash_booking_id']
        payment_status = data['payment_status']
        
        if payment_status == 'verified':
            print(f"✅ PASS - UPI payment auto-verified")
            print(f"   Booking ID: {booking_id}")
            print(f"   Payment Status: {payment_status} (expected: 'verified')")
            print()
            tests_passed += 1
        else:
            print(f"❌ FAIL - UPI payment not auto-verified")
            print(f"   Got: {payment_status}, Expected: 'verified'")
            print()
    else:
        print(f"❌ FAIL - Failed to create UPI booking")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.content.decode()}")
        print()
    
    # Test 2: CC payment auto-verification
    print("3️⃣ TEST 2: Credit Card Payment - Should Auto-Verify")
    print("-" * 80)
    tests_total += 1
    
    payload_cc = {
        'service_type': 'Full Service',
        'lot': lot.lot_id,
        'scheduled_time': (base_time + timedelta(hours=2)).isoformat(),
        'notes': 'CC payment test',
        'payment_method': 'CC',
        'price': str(Decimal('499.00')),
    }
    
    response = client.post(
        '/api/carwash-bookings/',
        data=json.dumps(payload_cc),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {user_token.key}'
    )
    
    if response.status_code == 201:
        data = json.loads(response.content.decode())
        booking_id = data['carwash_booking_id']
        payment_status = data['payment_status']
        
        if payment_status == 'verified':
            print(f"✅ PASS - CC payment auto-verified")
            print(f"   Booking ID: {booking_id}")
            print(f"   Payment Status: {payment_status} (expected: 'verified')")
            print()
            tests_passed += 1
        else:
            print(f"❌ FAIL - CC payment not auto-verified")
            print(f"   Got: {payment_status}, Expected: 'verified'")
            print()
    else:
        print(f"❌ FAIL - Failed to create CC booking")
        print(f"   Status: {response.status_code}")
        print()
    
    # Test 3: Cash payment stays pending
    print("4️⃣ TEST 3: Cash Payment - Should Stay Pending")
    print("-" * 80)
    tests_total += 1
    
    payload_cash = {
        'service_type': 'Interior Deep Clean',
        'lot': lot.lot_id,
        'scheduled_time': (base_time + timedelta(hours=4)).isoformat(),
        'notes': 'Cash payment test',
        'payment_method': 'Cash',
        'price': str(Decimal('350.00')),
    }
    
    response = client.post(
        '/api/carwash-bookings/',
        data=json.dumps(payload_cash),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {user_token.key}'
    )
    
    if response.status_code == 201:
        data = json.loads(response.content.decode())
        booking_id = data['carwash_booking_id']
        payment_status = data['payment_status']
        
        if payment_status == 'pending':
            print(f"✅ PASS - Cash payment stays pending")
            print(f"   Booking ID: {booking_id}")
            print(f"   Payment Status: {payment_status} (expected: 'pending')")
            print()
            tests_passed += 1
        else:
            print(f"❌ FAIL - Cash payment auto-verified (should be pending)")
            print(f"   Got: {payment_status}, Expected: 'pending'")
            print()
    else:
        print(f"❌ FAIL - Failed to create Cash booking")
        print(f"   Status: {response.status_code}")
        print()
    
    # Summary
    print("="*80)
    print(f"✅ RESULTS: {tests_passed}/{tests_total} Tests Passed")
    print("="*80 + "\n")
    
    if tests_passed == tests_total:
        print("✅ All auto-verification tests passed!")
        print("\nPayment Method Summary:")
        print("  • UPI: Auto-verified immediately on booking")
        print("  • CC: Auto-verified immediately on booking")
        print("  • Cash: Stays pending, requires owner verification\n")
        return True
    else:
        print(f"❌ {tests_total - tests_passed} test(s) failed")
        return False


if __name__ == '__main__':
    result = test_payment_auto_verification()
    sys.exit(0 if result else 1)
