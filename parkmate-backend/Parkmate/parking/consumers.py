"""
WebSocket consumers for real-time notifications
"""
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging

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
