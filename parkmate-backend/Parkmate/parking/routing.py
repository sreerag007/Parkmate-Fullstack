"""
WebSocket routing for real-time notifications and time synchronization
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/notifications/(?P<user_id>[\w\-]+)/$", consumers.NotificationConsumer.as_asgi()),
    re_path(r"^ws/time/$", consumers.TimeSyncConsumer.as_asgi()),
]
