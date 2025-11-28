#!/usr/bin/env python
"""Test booking creation via API endpoint using urllib"""
import urllib.request
import json
from datetime import datetime, timedelta

BASE_URL = 'http://127.0.0.1:8000'

print("=" * 60)
print("TESTING BOOKING API ENDPOINT")
print("=" * 60)

# Login first
print("\n1. Logging in...")
login_payload = {
    'username': 'testuser_booking',
    'password': 'testpass123'
}

login_request = urllib.request.Request(
    f'{BASE_URL}/api/auth/login/',
    data=json.dumps(login_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    login_response = urllib.request.urlopen(login_request)
    auth_data = json.loads(login_response.read().decode('utf-8'))
    token = auth_data.get('token')
    print(f"✅ Login successful, token: {token[:20]}...")
except Exception as e:
    print(f"❌ Login failed: {str(e)}")
    exit(1)

# Test instant booking
print("\n2. Creating instant booking...")
booking_payload = {
    'slot': 6,
    'vehicle_number': 'KL-08-AZ-1234',
    'booking_type': 'Instant'
}

print(f"   Payload: {booking_payload}")

booking_request = urllib.request.Request(
    f'{BASE_URL}/api/bookings/',
    data=json.dumps(booking_payload).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Token {token}'
    }
)

try:
    booking_response = urllib.request.urlopen(booking_request)
    booking_data = json.loads(booking_response.read().decode('utf-8'))
    print(f"✅ Booking created successfully!")
    print(f"   Booking ID: {booking_data.get('booking_id')}")
    print(f"   Status: {booking_data.get('status')}")
    print(f"   Start Time: {booking_data.get('start_time')}")
    print(f"   End Time: {booking_data.get('end_time')}")
    print(f"   Price: {booking_data.get('price')}")
except urllib.error.HTTPError as e:
    print(f"❌ Booking creation failed!")
    print(f"Status Code: {e.code}")
    error_data = e.read().decode('utf-8')
    print(f"Response: {error_data[:500]}...")
    if e.code == 500:
        print("\n💡 Check server logs for full error traceback")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "=" * 60)
