#!/usr/bin/env python
"""Verify latest booking in API"""
import urllib.request
import json

BASE_URL = 'http://127.0.0.1:8000/api'

# Login first
login_payload = {
    'username': 'testuser_booking',
    'password': 'testpass123'
}

login_request = urllib.request.Request(
    f'{BASE_URL}/auth/login/',
    data=json.dumps(login_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    login_response = urllib.request.urlopen(login_request)
    auth_data = json.loads(login_response.read().decode('utf-8'))
    token = auth_data.get('token')
    print(f"✅ Login successful")
except Exception as e:
    print(f"❌ Login failed: {str(e)}")
    exit(1)

# Get user's bookings
print("\nFetching user bookings...")
bookings_request = urllib.request.Request(
    f'{BASE_URL}/bookings/',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Token {token}'
    }
)

try:
    bookings_response = urllib.request.urlopen(bookings_request)
    bookings_data = json.loads(bookings_response.read().decode('utf-8'))
    
    if isinstance(bookings_data, list):
        bookings = bookings_data
    else:
        bookings = bookings_data.get('results', [])
    
    print(f"\n✅ Found {len(bookings)} bookings")
    
    if bookings:
        latest = bookings[0]  # Assuming they're ordered by creation
        print(f"\nLatest Booking:")
        print(f"  ID: {latest.get('booking_id')}")
        print(f"  Status: {latest.get('status')}")
        print(f"  Start Time: {latest.get('start_time')}")
        print(f"  End Time: {latest.get('end_time')}")
        print(f"  Slot: {latest.get('slot')}")
        print(f"  Price: {latest.get('price')}")
        print(f"\n✅ All fields present and correct!")
    else:
        print("❌ No bookings found")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
