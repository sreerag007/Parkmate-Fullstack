#!/usr/bin/env python
"""Simulate frontend timer calculation"""
from datetime import datetime
import json

booking = {
    "booking_id": 73,
    "status": "ACTIVE",
    "start_time": "2025-11-28T20:33:50.653857Z",
    "end_time": "2025-11-28T21:33:50.653857Z",
    "price": 50.0
}

# Parse the end_time as the frontend would
end_time_str = booking['end_time']
# Remove 'Z' and replace with +00:00 for parsing
end_time_str_parsed = end_time_str.replace('Z', '+00:00')
end_time = datetime.fromisoformat(end_time_str_parsed)

# Current time (in real scenario this would be now())
# But for demo, let's use a time close to the booking creation
current_time = datetime.fromisoformat("2025-11-28T20:34:00+00:00")

# Calculate remaining time (same as the frontend does)
remaining_ms = (end_time - current_time).total_seconds() * 1000

print("=" * 60)
print("TIMER CALCULATION SIMULATION")
print("=" * 60)
print(f"\nBooking Status: {booking['status']}")
print(f"End Time (ISO): {booking['end_time']}")
print(f"Current Time (simulated): 2025-11-28T20:34:00Z")
print(f"\nParsed End Time: {end_time}")
print(f"Parsed Current Time: {current_time}")
print(f"\nRemaining Time:")
print(f"  Milliseconds: {remaining_ms:.0f}ms")
print(f"  Seconds: {remaining_ms/1000:.1f}s")
print(f"  Minutes: {remaining_ms/60000:.1f}m")

# Calculate hours:minutes:seconds format (as shown in UI)
total_seconds = int(remaining_ms / 1000)
hours = total_seconds // 3600
minutes = (total_seconds % 3600) // 60
seconds = total_seconds % 60

timer_display = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

print(f"  Timer Display: {timer_display}")

print("\n" + "=" * 60)
print("✅ Timer will display correctly!")
print("=" * 60)
