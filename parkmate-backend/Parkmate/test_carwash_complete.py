#!/usr/bin/env python
"""
Comprehensive end-to-end test for Car Wash Verify & Confirm functionality.
Tests both backend API and simulates frontend interactions.
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
import json

def test_full_workflow():
    """Test the complete workflow: Create booking → Verify → Confirm"""
    print("\n" + "="*80)
    print("COMPLETE WORKFLOW TEST: Create → Verify → Confirm")
    print("="*80 + "\n")
    
    client = Client()
    
    # Setup test users
    print("1️⃣ SETUP: Creating test users and data...")
    print("-" * 80)
    
    owner_user, _ = AuthUser.objects.get_or_create(
        username='workflow_owner',
        defaults={'role': 'Owner'}
    )
    owner_token, _ = Token.objects.get_or_create(user=owner_user)
    owner_profile, _ = OwnerProfile.objects.get_or_create(auth_user=owner_user)
    
    lot, _ = P_Lot.objects.get_or_create(
        lot_name='Workflow Test Lot',
        defaults={
            'owner': owner_profile,
            'streetname': 'Workflow St',
            'city': 'Test City',
            'state': 'Test State',
            'pincode': '123456',
            'total_slots': 10
        }
    )
    
    user, _ = AuthUser.objects.get_or_create(
        username='workflow_user',
        defaults={'role': 'User'}
    )
    user_profile, _ = UserProfile.objects.get_or_create(
        auth_user=user,
        defaults={'firstname': 'Test', 'lastname': 'Customer'}
    )
    
    # Create booking
    booking = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Full Service',
        price=Decimal('499.00'),
        payment_method='Cash',
        payment_status='pending',
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=2)
    )
    
    print(f"✅ Owner created: {owner_user.username}")
    print(f"✅ Customer created: {user.username}")
    print(f"✅ Lot created: {lot.lot_name}")
    print(f"✅ Booking created: #{booking.carwash_booking_id}")
    print(f"   - Initial Status: {booking.status}")
    print(f"   - Initial Payment Status: {booking.payment_status}")
    print()
    
    # STEP 1: Verify Payment
    print("2️⃣ STEP 1: Owner Verifies Cash Payment")
    print("-" * 80)
    print(f"Request: PATCH /api/owner/carwash-bookings/{booking.carwash_booking_id}/verify-payment/")
    print(f"Authorization: Token {owner_token.key[:20]}...")
    
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking.carwash_booking_id}/verify-payment/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    
    print(f"Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        booking.refresh_from_db()
        
        print(f"✅ SUCCESS")
        print(f"   Message: {data['message']}")
        print(f"   Updated Payment Status: {booking.payment_status}")
        print(f"   Booking Status: {booking.status}")
        print()
    else:
        print(f"❌ FAILED")
        print(f"Response: {response.content.decode()}")
        return False
    
    # STEP 2: Confirm Booking
    print("3️⃣ STEP 2: Owner Confirms Booking")
    print("-" * 80)
    print(f"Request: PATCH /api/owner/carwash-bookings/{booking.carwash_booking_id}/confirm-booking/")
    print(f"Authorization: Token {owner_token.key[:20]}...")
    
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking.carwash_booking_id}/confirm-booking/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    
    print(f"Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        booking.refresh_from_db()
        
        print(f"✅ SUCCESS")
        print(f"   Message: {data['message']}")
        print(f"   Updated Booking Status: {booking.status}")
        print(f"   Payment Status: {booking.payment_status}")
        print()
    else:
        print(f"❌ FAILED")
        print(f"Response: {response.content.decode()}")
        return False
    
    # Final state check
    print("4️⃣ FINAL STATE: Booking Confirmed")
    print("-" * 80)
    print(f"Booking #{booking.carwash_booking_id}:")
    print(f"  ✅ Status: {booking.status} (expected: 'confirmed')")
    print(f"  ✅ Payment Status: {booking.payment_status} (expected: 'verified')")
    print(f"  ✅ Payment Method: {booking.payment_method}")
    print(f"  ✅ Service: {booking.service_type}")
    print(f"  ✅ Price: ₹{booking.price}")
    print()
    
    # Verify state is correct
    if booking.status == 'confirmed' and booking.payment_status == 'verified':
        print("="*80)
        print("✅ COMPLETE WORKFLOW TEST PASSED")
        print("="*80)
        return True
    else:
        print("="*80)
        print("❌ COMPLETE WORKFLOW TEST FAILED - State mismatch")
        print("="*80)
        return False


def test_error_conditions():
    """Test all error conditions and edge cases"""
    print("\n" + "="*80)
    print("ERROR HANDLING & EDGE CASES TEST")
    print("="*80 + "\n")
    
    client = Client()
    
    # Setup
    owner_user, _ = AuthUser.objects.get_or_create(
        username='error_test_owner',
        defaults={'role': 'Owner'}
    )
    owner_token, _ = Token.objects.get_or_create(user=owner_user)
    owner_profile, _ = OwnerProfile.objects.get_or_create(auth_user=owner_user)
    
    lot, _ = P_Lot.objects.get_or_create(
        lot_name='Error Test Lot',
        defaults={
            'owner': owner_profile,
            'streetname': 'Error St',
            'city': 'Test City',
            'state': 'Test State',
            'pincode': '123456',
            'total_slots': 10
        }
    )
    
    user, _ = AuthUser.objects.get_or_create(
        username='error_test_user',
        defaults={'role': 'User'}
    )
    user_profile, _ = UserProfile.objects.get_or_create(auth_user=user)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Non-existent booking
    print("Test 1: Non-existent Booking")
    print("-" * 80)
    tests_total += 1
    response = client.patch(
        '/api/owner/carwash-bookings/99999/verify-payment/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    if response.status_code == 404:
        print("✅ PASS - Returns 404 for non-existent booking\n")
        tests_passed += 1
    else:
        print(f"❌ FAIL - Expected 404, got {response.status_code}\n")
    
    # Test 2: UPI payment verification (should fail)
    print("Test 2: Try to Verify UPI Payment (should fail)")
    print("-" * 80)
    tests_total += 1
    booking_upi = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Exterior',
        price=Decimal('299.00'),
        payment_method='UPI',
        payment_status='pending',
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=2)
    )
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_upi.carwash_booking_id}/verify-payment/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    if response.status_code == 400:
        data = json.loads(response.content.decode())
        if 'Only Cash payments' in data.get('error', ''):
            print("✅ PASS - Correctly rejects UPI payment verification")
            print(f"   Error: {data['error']}\n")
            tests_passed += 1
        else:
            print(f"❌ FAIL - Wrong error message: {data.get('error')}\n")
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}\n")
    
    # Test 3: Confirm without verified payment
    print("Test 3: Try to Confirm Without Verified Payment (should fail)")
    print("-" * 80)
    tests_total += 1
    booking_unverified = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Interior Deep Clean',
        price=Decimal('350.00'),
        payment_method='Cash',
        payment_status='pending',
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=3)
    )
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_unverified.carwash_booking_id}/confirm-booking/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    if response.status_code == 400:
        data = json.loads(response.content.decode())
        if 'Payment must be verified' in data.get('error', ''):
            print("✅ PASS - Correctly prevents confirm without verified payment")
            print(f"   Error: {data['error']}\n")
            tests_passed += 1
        else:
            print(f"❌ FAIL - Wrong error message: {data.get('error')}\n")
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}\n")
    
    # Test 4: Double verification
    print("Test 4: Try to Verify Already Verified Payment")
    print("-" * 80)
    tests_total += 1
    booking_verified = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Full Service',
        price=Decimal('499.00'),
        payment_method='Cash',
        payment_status='verified',
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=4)
    )
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_verified.carwash_booking_id}/verify-payment/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        if 'already verified' in data.get('message', '').lower():
            print("✅ PASS - Handles already verified payment gracefully")
            print(f"   Message: {data['message']}\n")
            tests_passed += 1
        else:
            print(f"❌ FAIL - Unexpected message\n")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}\n")
    
    print("="*80)
    print(f"ERROR HANDLING TESTS: {tests_passed}/{tests_total} PASSED")
    print("="*80 + "\n")
    
    return tests_passed == tests_total


if __name__ == '__main__':
    workflow_ok = test_full_workflow()
    errors_ok = test_error_conditions()
    
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    print(f"Workflow Test: {'✅ PASSED' if workflow_ok else '❌ FAILED'}")
    print(f"Error Handling Test: {'✅ PASSED' if errors_ok else '❌ FAILED'}")
    print("="*80 + "\n")
    
    sys.exit(0 if (workflow_ok and errors_ok) else 1)
