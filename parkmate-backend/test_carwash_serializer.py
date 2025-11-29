#!/usr/bin/env python
"""Test script to verify enhanced BookingSerializer with carwash"""

import os
import sys
import django

# Add the Parkmate directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Parkmate'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from parking.serializers import BookingSerializer

def test_with_carwash():
    """Test booking with car wash service"""
    
    # Find bookings with carwash
    bookings = Booking.objects.filter(booking_by_user__isnull=False).distinct()[:3]
    
    if not bookings.exists():
        print("❌ No bookings with car wash found")
        return
    
    print("\n" + "="*70)
    print("🧼 TESTING BOOKING WITH CAR WASH SERVICE")
    print("="*70)
    
    for booking in bookings:
        print(f"\n{'─'*70}")
        print(f"📌 Booking ID: {booking.booking_id}")
        print(f"   Slot Price: ₹{booking.price}")
        
        carwash = booking.booking_by_user.first()
        print(f"   Car Wash Type: {carwash.carwash_type.name}")
        print(f"   Car Wash Price: ₹{carwash.carwash_type.price}")
        
        serializer = BookingSerializer(booking)
        data = serializer.data
        
        print(f"\n📊 SERIALIZER OUTPUT:")
        print(f"   Total Amount: ₹{data.get('total_amount', 'NOT SET')}")
        print(f"   Payments: {len(data.get('payments', []))} item(s)")
        
        if data.get('payments'):
            for i, payment in enumerate(data['payments']):
                print(f"     - Payment {i+1}: {payment['payment_type']} - ₹{payment['amount']}")
        
        if data.get('carwash'):
            carwash_data = data['carwash']
            carwash_type = carwash_data.get('carwash_type_detail', {})
            print(f"   Car Wash Data: {carwash_type.get('name')} - ₹{carwash_type.get('price')}")
        
        print(f"{'─'*70}")
    
    print("\n" + "="*70)
    print("✅ CARWASH TEST COMPLETE")
    print("="*70 + "\n")

if __name__ == '__main__':
    test_with_carwash()
