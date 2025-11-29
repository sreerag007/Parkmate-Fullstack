"""
Utility functions for sending WebSocket notifications to users.
Used by Django signals to trigger real-time notifications.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)


def send_ws_notification(user_id, level, message):
    """
    Send a WebSocket notification to a specific user.
    
    Args:
        user_id (int or str): The user ID to send notification to
        level (str): Notification type - 'success', 'warning', 'error', 'info'
        message (str): The notification message
    
    Example:
        send_ws_notification(user.id, 'success', 'Payment verified successfully!')
    """
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {
                "type": "send_notification",
                "level": level,
                "message": message
            }
        )
        logger.info(f"📢 Sent {level} notification to user {user_id}")
    except Exception as e:
        logger.error(f"❌ Failed to send notification to user {user_id}: {str(e)}")


def send_ws_notification_to_owner(owner_id, level, message):
    """
    Send a WebSocket notification to an owner.
    (Same as send_ws_notification, but with clearer intent)
    """
    send_ws_notification(owner_id, level, message)


def send_ws_notification_to_admin(admin_id, level, message):
    """
    Send a WebSocket notification to an admin user.
    (Same as send_ws_notification, but with clearer intent)
    """
    send_ws_notification(admin_id, level, message)
