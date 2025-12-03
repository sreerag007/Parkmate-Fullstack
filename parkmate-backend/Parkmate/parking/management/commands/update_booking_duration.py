from django.core.management.base import BaseCommand
from parking.models import Booking
from datetime import timedelta
from django.utils import timezone

class Command(BaseCommand):
    help = 'Update all existing bookings to use 10-minute duration instead of 1 hour'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== UPDATING BOOKING DURATIONS ===\n'))
        
        # Get all active bookings that haven't expired yet
        now = timezone.now()
        active_bookings = Booking.objects.filter(
            status__in=['booked', 'BOOKED', 'ACTIVE']
        ).exclude(
            status__in=['completed', 'COMPLETED', 'cancelled', 'CANCELLED']
        )
        
        count = 0
        for booking in active_bookings:
            if booking.start_time and booking.end_time:
                # Calculate the old duration (should be about 1 hour / 3600 seconds)
                old_duration = booking.end_time - booking.start_time
                old_duration_seconds = old_duration.total_seconds()
                
                # If it's roughly 1 hour (3600 seconds), update it to 10 minutes
                if old_duration_seconds >= 3500 and old_duration_seconds <= 3700:  # Allow ~100 second variance
                    old_end_time = booking.end_time
                    booking.end_time = booking.start_time + timedelta(minutes=10)
                    booking.save()
                    count += 1
                    
                    self.stdout.write(
                        f'✅ Booking {booking.booking_id}: '
                        f'{old_end_time.strftime("%H:%M:%S")} → '
                        f'{booking.end_time.strftime("%H:%M:%S")}'
                    )
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Updated {count} bookings to 10-minute duration\n'))
        
        if count == 0:
            self.stdout.write(self.style.WARNING('No bookings found with 1-hour duration\n'))
