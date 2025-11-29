/**
 * Custom React hook for real-time WebSocket notifications
 * Connects to Django Channels WebSocket endpoint
 * 
 * Usage in component:
 *   const { isConnected } = useWebSocketNotifications(userId);
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

export const useWebSocketNotifications = (userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      console.warn('⚠️  useWebSocketNotifications: userId is not provided');
      return;
    }

    const connectWebSocket = () => {
      try {
        // Use hardcoded WebSocket URL or fallback to current host
        const wsUrl = `ws://127.0.0.1:8000/ws/notifications/${userId}/`;

        console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = (event) => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📬 WebSocket message received:', data);

            // Check if connection confirmation message
            if (data.connected === true) {
              console.log('✅ Real-time notifications active');
              return;
            }

            // Send notification using React Toastify
            const notificationType = data.type || 'info';
            const message = data.message || 'Notification received';

            // Map notification types to toast methods
            const toastMethods = {
              success: toast.success,
              error: toast.error,
              warning: toast.warning,
              info: toast.info
            };

            const toastMethod = toastMethods[notificationType] || toast.info;
            toastMethod(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        socketRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setIsConnected(false);
        };

        socketRef.current.onclose = (event) => {
          console.log('❌ WebSocket disconnected', event.code);
          setIsConnected(false);

          // Auto-reconnect after 5 seconds
          console.log('🔄 Reconnecting in 5 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        };
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [userId]);

  return { isConnected, socket: socketRef.current };
};
