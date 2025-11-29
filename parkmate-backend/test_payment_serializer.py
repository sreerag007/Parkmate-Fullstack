#!/usr/bin/env python
"""Test script to verify enhanced BookingSerializer with payments and total_amount"""

import os
import sys
import django

# Add the Parkmate directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Parkmate'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import Booking
from parking.serializers import BookingSerializer

def test_booking_serializer():
    """Test the enhanced BookingSerializer"""
    
    # Get bookings with payments
    bookings = Booking.objects.filter(payments__isnull=False).distinct()[:5]
    
    if not bookings.exists():
        print("❌ No bookings with payments found. Create a booking first.")
        return
    
    print("\n" + "="*70)
    print("🧪 TESTING ENHANCED BOOKINGSERIALIZER")
    print("="*70)
    
    for booking in bookings:
        print(f"\n{'─'*70}")
        print(f"📌 Booking ID: {booking.booking_id}")
        print(f"   Status: {booking.status}")
        print(f"   Slot Price: ₹{booking.price}")
        print(f"   Total Payments: {booking.payments.count()}")
        
        serializer = BookingSerializer(booking)
        data = serializer.data
        
        # Check for payments array
        if data.get('payments'):
            print(f"\n✅ PAYMENTS ARRAY: {len(data['payments'])} payment(s)")
            for i, payment in enumerate(data['payments']):
                print(f"   ├─ Payment {i+1}:")
                print(f"   │  ├─ Type: {payment.get('payment_type', 'N/A')}")
                print(f"   │  ├─ Method: {payment.get('payment_method', 'N/A')}")
                print(f"   │  ├─ Amount: ₹{payment.get('amount', '0')}")
                print(f"   │  ├─ Status: {payment.get('status', 'N/A')}")
                print(f"   │  └─ Transaction ID: {payment.get('transaction_id', 'N/A')}")
        else:
            print(f"\n⚠️  No payments array found")
        
        # Check for total_amount
        if data.get('total_amount'):
            print(f"\n💰 TOTAL AMOUNT: ₹{data['total_amount']}")
        else:
            print(f"\n⚠️  No total_amount computed")
        
        # Check for carwash
        if data.get('carwash'):
            carwash = data['carwash']
            carwash_type = carwash.get('carwash_type_detail', {})
            print(f"\n🧼 CAR WASH SERVICE:")
            print(f"   ├─ Type: {carwash_type.get('name', 'N/A')}")
            print(f"   ├─ Description: {carwash_type.get('description', 'N/A')}")
            print(f"   └─ Price: ₹{carwash_type.get('price', '0')}")
        else:
            print(f"\nℹ️  No car wash service for this booking")
        
        print(f"{'─'*70}")
    
    print("\n" + "="*70)
    print("✅ TEST COMPLETE")
    print("="*70 + "\n")

if __name__ == '__main__':
    test_booking_serializer()
