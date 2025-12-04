"""
WebSocket consumers for real-time notifications and time synchronization
"""
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for sending real-time notifications to users.
    
    Connection URL: ws://localhost:8000/ws/notifications/{user_id}/
    
    Events Sent (via send_ws_notification):
    1. Timer < 5 min
    2. Timer = 0 (Booking expired)
    3. Renew Success
    4. Renew Failure
    5. Slot Auto-Expired
    6. Booking Declined by Admin
    7. Cash Payment Verified
    8. New Booking Created
    9. Car Wash Completed
    10. Owner Assigned New Employee
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]
        self.room_group_name = f"user_{self.user_id}"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"✅ WebSocket connected for user {self.user_id}")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            "type": "info",
            "message": "Connected to real-time notifications",
            "connected": True
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"❌ WebSocket disconnected for user {self.user_id}")
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def send_notification(self, event):
        """
        Receive notification from backend signal and send to WebSocket.
        
        Event structure from backend:
        {
            "type": "send_notification",
            "level": "success|warning|error|info",
            "message": "Notification message"
        }
        """
        level = event.get("level", "info")
        message = event.get("message", "")
        
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            "type": level,
            "message": message
        }))
        
        logger.info(f"📢 Sent {level} notification to user {self.user_id}: {message}")


class TimeSyncConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for broadcasting real-time server date & time.
    
    Connection URL: ws://localhost:8000/ws/time/
    
    Sends server time every second in multiple formats:
    - ISO 8601 format for parsing
    - Formatted human-readable string
    - Unix timestamp
    
    This ensures all frontend modules (slot booking, carwash, payments)
    are synchronized with the server's real-world time.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.broadcast_task = None
        self.is_connected = False
    
    async def connect(self):
        """Accept WebSocket connection and start broadcasting time"""
        await self.accept()
        self.is_connected = True
        logger.info("✅ Time sync WebSocket connected")
        
        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            "type": "connected",
            "message": "Real-time server clock connected",
            "connected": True
        }))
        
        # Start background task for broadcasting time
        self.broadcast_task = asyncio.create_task(self.broadcast_time())
    
    async def broadcast_time(self):
        """Background task that broadcasts server time every second"""
        try:
            while self.is_connected:
                current_time = timezone.localtime(timezone.now())
                
                # Prepare time data in multiple formats
                time_data = {
                    "type": "time_update",
                    "datetime": current_time.isoformat(),  # ISO 8601 format
                    "formatted": current_time.strftime("%A, %B %d %Y, %I:%M:%S %p"),  # Human readable
                    "date": current_time.strftime("%Y-%m-%d"),  # Date only
                    "time": current_time.strftime("%I:%M:%S %p"),  # Time only
                    "time_24h": current_time.strftime("%H:%M:%S"),  # 24-hour format
                    "timestamp": int(current_time.timestamp()),  # Unix timestamp
                    "year": current_time.year,
                    "month": current_time.month,
                    "day": current_time.day,
                    "hour": current_time.hour,
                    "minute": current_time.minute,
                    "second": current_time.second,
                    "weekday": current_time.strftime("%A"),
                    "timezone": str(current_time.tzinfo)
                }
                
                # Send time update to client
                await self.send(text_data=json.dumps(time_data))
                
                # Wait 1 second before next update
                await asyncio.sleep(1)
                
        except asyncio.CancelledError:
            # Task was cancelled (connection closing)
            logger.info("⏹ Time broadcast task cancelled")
        except Exception as e:
            logger.error(f"❌ Error in time sync broadcast: {str(e)}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        self.is_connected = False
        
        # Cancel the broadcast task if it's running
        if self.broadcast_task and not self.broadcast_task.done():
            self.broadcast_task.cancel()
            try:
                await self.broadcast_task
            except asyncio.CancelledError:
                pass
        
        logger.info(f"❌ Time sync WebSocket disconnected with code {close_code}")

