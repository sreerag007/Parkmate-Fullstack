"""
ASGI config for Parkmate project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import logging
from django.core.asgi import get_asgi_application
from channels.routing import URLRouter
from parking.routing import websocket_urlpatterns

# Setup logging
logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Parkmate.settings')

django_asgi_app = get_asgi_application()

# ASGI application that properly routes HTTP and WebSocket requests
async def application(scope, receive, send):
    """
    Main ASGI application entry point.
    Routes requests to appropriate handlers based on protocol type.
    """
    if scope['type'] == 'websocket':
        # Route WebSocket connections to the WebSocket handler
        router = URLRouter(websocket_urlpatterns)
        await router(scope, receive, send)
    elif scope['type'] == 'http':
        # Route HTTP requests through Django
        await django_asgi_app(scope, receive, send)
    elif scope['type'] == 'lifespan':
        # Handle lifespan events
        await django_asgi_app(scope, receive, send)
    else:
        # Unknown scope type
        await send({
            'type': 'http.response.start',
            'status': 400,
            'headers': [[b'content-type', b'text/plain']],
        })
        await send({
            'type': 'http.response.body',
            'body': b'Unknown request type',
        })


