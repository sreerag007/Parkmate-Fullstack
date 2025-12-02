"""
Fix existing car wash bookings to apply auto-verification logic retroactively.
Updates UPI and CC payments from 'pending' to 'verified' status.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import CarWashBooking

def fix_existing_payments():
    """Update existing UPI and CC bookings to auto-verified status"""
    
    print("=" * 80)
    print("🔧 FIXING EXISTING PAYMENT STATUSES")
    print("=" * 80)
    
    # Get UPI bookings with pending payment status
    upi_bookings = CarWashBooking.objects.filter(
        payment_method='UPI',
        payment_status='pending'
    )
    
    cc_bookings = CarWashBooking.objects.filter(
        payment_method='CC',
        payment_status='pending'
    )
    
    print(f"\n📋 Found {upi_bookings.count()} UPI bookings with pending status")
    print(f"📋 Found {cc_bookings.count()} CC bookings with pending status")
    
    # Update UPI bookings
    if upi_bookings.count() > 0:
        print("\n🔄 Updating UPI bookings to verified...")
        for booking in upi_bookings:
            print(f"   Booking #{booking.carwash_booking_id}: {booking.payment_method} {booking.payment_status} → verified")
            booking.payment_status = 'verified'
            booking.save()
        upi_count = upi_bookings.count()
        print(f"✅ Updated {upi_count} UPI booking(s)")
    
    # Update CC bookings
    if cc_bookings.count() > 0:
        print("\n🔄 Updating CC bookings to verified...")
        for booking in cc_bookings:
            print(f"   Booking #{booking.carwash_booking_id}: {booking.payment_method} {booking.payment_status} → verified")
            booking.payment_status = 'verified'
            booking.save()
        cc_count = cc_bookings.count()
        print(f"✅ Updated {cc_count} CC booking(s)")
    
    # Verify the update
    print("\n" + "=" * 80)
    print("✅ VERIFICATION")
    print("=" * 80)
    
    pending_upi = CarWashBooking.objects.filter(
        payment_method='UPI',
        payment_status='pending'
    )
    pending_cc = CarWashBooking.objects.filter(
        payment_method='CC',
        payment_status='pending'
    )
    
    verified_upi = CarWashBooking.objects.filter(
        payment_method='UPI',
        payment_status='verified'
    )
    verified_cc = CarWashBooking.objects.filter(
        payment_method='CC',
        payment_status='verified'
    )
    
    print(f"\nUPI Bookings:")
    print(f"  • Pending: {pending_upi.count()}")
    print(f"  • Verified: {verified_upi.count()}")
    
    print(f"\nCC Bookings:")
    print(f"  • Pending: {pending_cc.count()}")
    print(f"  • Verified: {verified_cc.count()}")
    
    # Show all current bookings
    print("\n" + "=" * 80)
    print("📊 ALL CAR WASH BOOKINGS STATUS")
    print("=" * 80)
    
    all_bookings = CarWashBooking.objects.all().order_by('-carwash_booking_id')
    for booking in all_bookings:
        status_str = f"{booking.status.ljust(12)} | Payment: {booking.payment_method.ljust(6)} {booking.payment_status.ljust(8)}"
        print(f"  Booking #{booking.carwash_booking_id}: {status_str}")
    
    print("\n" + "=" * 80)
    print("✅ PAYMENT FIXES COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    fix_existing_payments()
