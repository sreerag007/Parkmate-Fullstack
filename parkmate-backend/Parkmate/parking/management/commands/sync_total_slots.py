from django.core.management.base import BaseCommand
from parking.models import P_Lot

class Command(BaseCommand):
    help = 'Sync total_slots field with actual slot count for all lots'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting total_slots synchronization...'))
        
        lots = P_Lot.objects.all()
        fixed_count = 0
        
        for lot in lots:
            actual_count = lot.slots.count()
            if lot.total_slots != actual_count:
                old_value = lot.total_slots
                lot.total_slots = actual_count
                lot.save()
                fixed_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Fixed {lot.lot_name}: {old_value} → {actual_count} total_slots'
                    )
                )
            else:
                self.stdout.write(
                    f'✓ {lot.lot_name}: Already correct ({actual_count} slots)'
                )
        
        if fixed_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'\n🎉 Successfully fixed {fixed_count} lot(s)')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\n✅ All lots already have correct total_slots')
            )
