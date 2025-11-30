from django.core.management.base import BaseCommand
from decimal import Decimal
from parking.models import P_Slot

class Command(BaseCommand):
    help = 'Update all slots with price=0.00 to price=50.00'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.WARNING("🔧 UPDATING SLOT PRICES"))
        self.stdout.write(self.style.WARNING("Setting all 0.00 prices to 50.00"))
        self.stdout.write("="*60)
        
        # Find all slots with price = 0
        zero_price_slots = P_Slot.objects.filter(price=Decimal('0.00'))
        count = zero_price_slots.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("\n✅ No slots with price=0.00 found. All slots already have pricing."))
            return
        
        self.stdout.write(f"\n📊 Found {count} slots with price=0.00")
        self.stdout.write("Updating to price=50.00...\n")
        
        # Update all slots with price=0 to price=50
        zero_price_slots.update(price=Decimal('50.00'))
        
        # Verify
        updated_slots = P_Slot.objects.filter(price=Decimal('50.00'))
        self.stdout.write(self.style.SUCCESS(f"✅ Successfully updated {count} slots"))
        self.stdout.write(self.style.SUCCESS(f"✅ Total slots with price=50.00: {updated_slots.count()}"))
        
        # Show summary
        price_summary = P_Slot.objects.values('price').distinct().order_by('price')
        self.stdout.write("\n📈 Price distribution after update:")
        for item in price_summary:
            slot_count = P_Slot.objects.filter(price=item['price']).count()
            self.stdout.write(f"   ₹{item['price']}: {slot_count} slots")
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("✅ SLOT PRICE UPDATE COMPLETE"))
        self.stdout.write("="*60 + "\n")
