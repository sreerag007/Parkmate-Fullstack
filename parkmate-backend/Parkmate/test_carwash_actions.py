#!/usr/bin/env python
"""
Test script for Verify and Confirm car wash booking actions.
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

def run_tests():
    print("\n" + "="*70)
    print("CAR WASH VERIFY AND CONFIRM ENDPOINTS TEST")
    print("="*70 + "\n")
    
    # Setup test data
    owner_user, _ = AuthUser.objects.get_or_create(
        username='owner_test_final',
        defaults={'role': 'Owner'}
    )
    owner_token, _ = Token.objects.get_or_create(user=owner_user)
    owner_profile, _ = OwnerProfile.objects.get_or_create(auth_user=owner_user)
    
    lot, _ = P_Lot.objects.get_or_create(
        lot_name='Test Lot Final',
        defaults={
            'owner': owner_profile,
            'streetname': 'Test Street',
            'city': 'Test City',
            'state': 'Test State',
            'pincode': '123456',
            'total_slots': 10
        }
    )
    
    user, _ = AuthUser.objects.get_or_create(
        username='user_test_final',
        defaults={'role': 'User'}
    )
    user_profile, _ = UserProfile.objects.get_or_create(auth_user=user)
    
    # Create test bookings
    booking_cash = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Exterior',
        price=Decimal('299.00'),
        payment_method='Cash',
        payment_status='pending',
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=2)
    )
    
    booking_upi = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Full Service',
        price=Decimal('499.00'),
        payment_method='UPI',
        payment_status='pending',
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=3)
    )
    
    print(f"Test Setup:")
    print(f"  Owner: {owner_user.username}")
    print(f"  Lot: {lot.lot_name}")
    print(f"  Booking 1 (Cash): ID={booking_cash.carwash_booking_id}")
    print(f"  Booking 2 (UPI): ID={booking_upi.carwash_booking_id}\n")
    
    client = Client()
    
    # Test 1: Verify Cash Payment
    print("TEST 1: Verify Cash Payment")
    print("-" * 70)
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_cash.carwash_booking_id}/verify-payment/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        print(f"Message: {data.get('message')}")
        print(f"Payment Status: {data.get('booking', {}).get('payment_status')}")
        print("✅ PASS\n")
    else:
        print(f"Response: {response.content.decode()[:500]}")
        print("❌ FAIL\n")
    
    # Refresh booking
    booking_cash.refresh_from_db()
    
    # Test 2: Confirm Booking
    print("TEST 2: Confirm Booking (after payment verified)")
    print("-" * 70)
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_cash.carwash_booking_id}/confirm-booking/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = json.loads(response.content.decode())
        print(f"Message: {data.get('message')}")
        print(f"Booking Status: {data.get('booking', {}).get('status')}")
        print("✅ PASS\n")
    else:
        print(f"Response: {response.content.decode()[:500]}")
        print("❌ FAIL\n")
    
    # Test 3: Reject verify for non-Cash payment
    print("TEST 3: Reject Verify for UPI Payment (should fail)")
    print("-" * 70)
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_upi.carwash_booking_id}/verify-payment/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        data = json.loads(response.content.decode())
        print(f"Error: {data.get('error')}")
        print("✅ PASS (correctly rejected)\n")
    else:
        print(f"Response: {response.content.decode()[:500]}")
        print("❌ FAIL (should have rejected)\n")
    
    # Test 4: Reject confirm without verified payment
    print("TEST 4: Reject Confirm without Verified Payment (should fail)")
    print("-" * 70)
    booking_pending = CarWashBooking.objects.create(
        user=user_profile,
        lot=lot,
        service_type='Interior Deep Clean',
        price=Decimal('350.00'),
        payment_method='Cash',
        payment_status='pending',  # Not verified
        status='pending',
        scheduled_time=datetime.now() + timedelta(hours=4)
    )
    response = client.patch(
        f'/api/owner/carwash-bookings/{booking_pending.carwash_booking_id}/confirm-booking/',
        data=json.dumps({}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {owner_token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        data = json.loads(response.content.decode())
        print(f"Error: {data.get('error')}")
        print("✅ PASS (correctly rejected)\n")
    else:
        print(f"Response: {response.content.decode()[:500]}")
        print("❌ FAIL (should have rejected)\n")
    
    print("="*70)
    print("ALL TESTS COMPLETED")
    print("="*70 + "\n")

if __name__ == '__main__':
    run_tests()
