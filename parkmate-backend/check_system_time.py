#!/usr/bin/env python
import os
import django
import sys
from datetime import datetime

sys.path.insert(0, r'c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')
django.setup()

from django.utils import timezone

now_utc = timezone.now()
now_local = datetime.now()

print(f'System local time: {now_local}')
print(f'Django UTC time: {now_utc}')
print(f'Django UTC ISO: {now_utc.isoformat()}')

# Convert UTC to IST
from datetime import timedelta
tz_offset = timedelta(hours=5, minutes=30)
now_ist = now_utc + tz_offset
print(f'Django IST time: {now_ist}')
print(f'Date in IST: {now_ist.date()}')
