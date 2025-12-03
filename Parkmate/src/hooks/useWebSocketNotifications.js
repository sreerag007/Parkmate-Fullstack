/**
 * Custom React hook for real-time WebSocket notifications
 * Connects to Django Channels WebSocket endpoint
 * 
 * Usage in component:
 *   const { isConnected } = useWebSocketNotifications(userId);
 */

/* global process */
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
        // Determine the correct backend URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname || 'localhost';
        
        // In development: connect to backend on port 8000
        // In production: connect to same host/port as frontend
        const backendPort = process.env.NODE_ENV === 'production' 
          ? (window.location.port || (window.location.protocol === 'https:' ? 443 : 80))
          : 8000;
        
        const wsUrl = `${protocol}//${hostname}:${backendPort}/ws/notifications/${userId}/`;

        console.log(`🔌 Connecting to WebSocket`);
        console.log(`   URL: ${wsUrl}`);
        console.log(`   Environment: ${process.env.NODE_ENV}`);
        console.log(`   Frontend: ${window.location.host}`);
        console.log(`   Backend: ${hostname}:${backendPort}`);

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
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

            // Handle car wash completion notification
            if (data.type === 'carwash_completed') {
              console.log('🚗 Car wash completion notification:', data);
              toast.success(data.message, {
                icon: '🎉',
                autoClose: 8000,
                position: 'top-right'
              });
              
              // Optional: Play a notification sound or trigger browser notification
              if (window.Notification && Notification.permission === 'granted') {
                new Notification(data.title || 'Car Wash Complete', {
                  body: data.message,
                  icon: '/logo.png',
                  badge: '/logo.png'
                });
              }
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

  // accessing ref.current during render is intentional for consumers
  // eslint-disable-next-line react-hooks/refs
  return { isConnected, socket: socketRef.current };
};
