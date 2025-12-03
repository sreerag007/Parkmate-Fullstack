from django.core.management.base import BaseCommand
from django.utils import timezone
from parking.models import Booking, P_Slot
from datetime import timedelta


class Command(BaseCommand):
    help = 'Clean up expired bookings and fix data inconsistencies'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== BOOKING CLEANUP COMMAND ===\n'))

        # 1. Auto-transition SCHEDULED -> ACTIVE
        self.stdout.write('1. Auto-transitioning SCHEDULED -> ACTIVE...')
        scheduled = Booking.objects.filter(status='SCHEDULED', start_time__lte=timezone.now())
        count = 0
        for booking in scheduled:
            booking.status = 'ACTIVE'
            booking.slot.is_available = False
            booking.slot.save()
            booking.save()
            count += 1
        self.stdout.write(self.style.SUCCESS(f'   Transitioned {count} bookings\n'))

        # 2. Auto-transition ACTIVE -> COMPLETED (expired)
        self.stdout.write('2. Auto-transitioning ACTIVE -> COMPLETED (expired)...')
        active = Booking.objects.filter(status='ACTIVE', end_time__lte=timezone.now())
        count = 0
        for booking in active:
            booking.status = 'COMPLETED'
            booking.slot.is_available = True
            booking.slot.save()
            booking.save()
            count += 1
        self.stdout.write(self.style.SUCCESS(f'   Transitioned {count} bookings\n'))

        # 3. Auto-transition old 'booked' status -> COMPLETED (expired)
        self.stdout.write('3. Auto-transitioning booked -> COMPLETED (expired)...')
        booked = Booking.objects.filter(status='booked', end_time__lte=timezone.now())
        count = 0
        for booking in booked:
            booking.status = 'COMPLETED'
            booking.slot.is_available = True
            booking.slot.save()
            booking.save()
            count += 1
        self.stdout.write(self.style.SUCCESS(f'   Transitioned {count} bookings\n'))

        # 4. Fix slots with is_available=False but no active bookings
        self.stdout.write('4. Fixing slot data inconsistencies...')
        problem_slots = []
        for slot in P_Slot.objects.filter(is_available=False):
            active_bookings = slot.booking_of_slot.exclude(
                status__iexact='COMPLETED'
            ).exclude(
                status__iexact='CANCELLED'
            )
            if not active_bookings.exists():
                problem_slots.append(slot)
                slot.is_available = True
                slot.save()
        
        self.stdout.write(self.style.SUCCESS(f'   Fixed {len(problem_slots)} slots\n'))

        # 5. Ensure all non-cancelled bookings have end_time
        self.stdout.write('5. Ensuring all bookings have valid times...')
        missing_end = Booking.objects.filter(end_time__isnull=True).exclude(
            status__in=['CANCELLED', 'cancelled']
        )
        count = 0
        for booking in missing_end:
            if booking.start_time:
                booking.end_time = booking.start_time + timedelta(minutes=10)
                booking.save()
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'   Fixed {count} bookings\n'))

        self.stdout.write(self.style.SUCCESS('=== CLEANUP COMPLETE ===\n'))
