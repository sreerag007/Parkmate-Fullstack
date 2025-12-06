"""
Script to create test carwash bookings for admin panel testing
"""
import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import CarWashBooking, UserProfile, P_Lot, AuthUser
from django.utils import timezone

def create_test_bookings():
    """Create sample carwash bookings with different statuses"""
    
    # Get first user and lot
    try:
        # Get a regular user (not admin/owner)
        auth_user = AuthUser.objects.filter(role='User').first()
        if not auth_user:
            auth_user = AuthUser.objects.first()  # Fallback to any user
        
        user = UserProfile.objects.filter(auth_user=auth_user).first() if auth_user else None
        lot = P_Lot.objects.first()
        
        if not user:
            print("❌ No users found! Please create a user first.")
            return
        
        if not lot:
            print("❌ No parking lots found! Please create a lot first.")
            return
        
        print(f"✅ Found user: {user.firstname} {user.lastname}")
        print(f"✅ Found lot: {lot.lot_name}")
        
        # Create test bookings with different statuses
        bookings_data = [
            {
                'service_type': 'Full Service',
                'price': 500.00,
                'payment_method': 'UPI',
                'payment_status': 'verified',
                'status': 'confirmed',
                'scheduled_time': timezone.now() + timedelta(days=1),
                'notes': 'Test booking - Full service with interior cleaning'
            },
            {
                'service_type': 'Exterior',
                'price': 250.00,
                'payment_method': 'Cash',
                'payment_status': 'pending',
                'status': 'pending',
                'scheduled_time': timezone.now() + timedelta(days=2),
                'notes': 'Test booking - Exterior wash only'
            },
            {
                'service_type': 'Interior Deep Clean',
                'price': 400.00,
                'payment_method': 'CC',
                'payment_status': 'verified',
                'status': 'in_progress',
                'scheduled_time': timezone.now() - timedelta(hours=2),
                'notes': 'Test booking - Deep interior cleaning in progress'
            },
            {
                'service_type': 'Full Service',
                'price': 500.00,
                'payment_method': 'UPI',
                'payment_status': 'verified',
                'status': 'completed',
                'scheduled_time': timezone.now() - timedelta(days=1),
                'completed_time': timezone.now() - timedelta(hours=5),
                'notes': 'Test booking - Completed full service'
            },
            {
                'service_type': 'Exterior',
                'price': 250.00,
                'payment_method': 'Cash',
                'payment_status': 'failed',
                'status': 'cancelled',
                'scheduled_time': timezone.now() + timedelta(days=3),
                'notes': 'Test booking - Cancelled due to payment failure'
            },
        ]
        
        created_count = 0
        for booking_data in bookings_data:
            booking = CarWashBooking.objects.create(
                user=user,
                lot=lot,
                **booking_data
            )
            created_count += 1
            print(f"✅ Created booking #{booking.carwash_booking_id}: {booking.service_type} - {booking.status}")
        
        print(f"\n🎉 Successfully created {created_count} test carwash bookings!")
        print(f"📊 Total carwash bookings in database: {CarWashBooking.objects.count()}")
        
    except Exception as e:
        print(f"❌ Error creating test bookings: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("🚀 Creating test carwash bookings...\n")
    create_test_bookings()
