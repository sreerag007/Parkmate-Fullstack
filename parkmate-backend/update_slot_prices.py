#!/usr/bin/env python
"""
Script to update all slots with price=0.00 to price=50.00
Run from Django shell or as a management command
"""

import os
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from parking.models import P_Slot

def update_slot_prices():
    """Update all slots with price=0 to price=50"""
    print("\n" + "="*60)
    print("🔧 UPDATING SLOT PRICES - Setting all 0.00 prices to 50.00")
    print("="*60)
    
    # Find all slots with price = 0
    zero_price_slots = P_Slot.objects.filter(price=Decimal('0.00'))
    count = zero_price_slots.count()
    
    if count == 0:
        print("✅ No slots with price=0.00 found. All slots already have pricing.")
        return
    
    print(f"\n📊 Found {count} slots with price=0.00")
    print("Updating to price=50.00...\n")
    
    # Update all slots with price=0 to price=50
    zero_price_slots.update(price=Decimal('50.00'))
    
    # Verify
    updated_slots = P_Slot.objects.filter(price=Decimal('50.00'))
    print(f"✅ Successfully updated {count} slots")
    print(f"✅ Total slots with price=50.00: {updated_slots.count()}")
    
    # Show summary
    price_summary = P_Slot.objects.values('price').distinct().order_by('price')
    print("\n📈 Price distribution after update:")
    for item in price_summary:
        slot_count = P_Slot.objects.filter(price=item['price']).count()
        print(f"   ₹{item['price']}: {slot_count} slots")
    
    print("\n" + "="*60)
    print("✅ SLOT PRICE UPDATE COMPLETE")
    print("="*60 + "\n")

if __name__ == '__main__':
    update_slot_prices()
