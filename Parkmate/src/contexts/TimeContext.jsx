/**
 * TimeContext - Global time synchronization context
 * Provides real-time server time to all components via WebSocket
 * 
 * Usage:
 *   import { useServerTime } from '@/contexts/TimeContext'
 *   const serverTime = useServerTime()
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'

const TimeContext = createContext(null)

export const TimeProvider = ({ children }) => {
  const [serverTime, setServerTime] = useState(new Date())
  const [timeData, setTimeData] = useState({
    datetime: new Date().toISOString(),
    formatted: '',
    date: '',
    time: '',
    timestamp: Math.floor(Date.now() / 1000),
    connected: false
  })
  const [isConnected, setIsConnected] = useState(false)
  const reconnectAttemptsRef = useRef(0)

  useEffect(() => {
    let socket = null
    let reconnectTimeout = null
    let hasShownDisconnectWarning = false
    let isCleaningUp = false

    const connectWebSocket = () => {
      // Don't create new connection if cleaning up
      if (isCleaningUp) return
      
      // Close existing socket if any
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close()
        socket = null
      }

      try {
        // Determine WebSocket URL based on environment
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const hostname = window.location.hostname || 'localhost'
        const backendPort = import.meta.env.MODE === 'production' 
          ? (window.location.port || (window.location.protocol === 'https:' ? 443 : 80))
          : 8000
        
        const wsUrl = `${protocol}//${hostname}:${backendPort}/ws/time/`

        console.log('🕐 Connecting to time sync WebSocket:', wsUrl)

        socket = new WebSocket(wsUrl)

        socket.onopen = () => {
          console.log('✅ Time sync WebSocket connected')
          setIsConnected(true)
          reconnectAttemptsRef.current = 0
          hasShownDisconnectWarning = false
        }

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle connection confirmation
            if (data.type === 'connected') {
              console.log('✅ Server time synchronization active')
              return
            }

            // Handle time updates
            if (data.type === 'time_update') {
              // Use timestamp to create Date object to avoid timezone conversion issues
              // The backend sends IST time, so we use the timestamp which is timezone-agnostic
              const newServerTime = new Date(data.timestamp * 1000)
              setServerTime(newServerTime)
              setTimeData({
                datetime: data.datetime,
                formatted: data.formatted,
                date: data.date,
                time: data.time,
                time_24h: data.time_24h,
                timestamp: data.timestamp,
                year: data.year,
                month: data.month,
                day: data.day,
                hour: data.hour,
                minute: data.minute,
                second: data.second,
                weekday: data.weekday,
                timezone: data.timezone,
                connected: true
              })
            }
          } catch (error) {
            console.error('❌ Error parsing time sync message:', error)
          }
        }

        socket.onerror = (error) => {
          console.error('❌ Time sync WebSocket error:', error)
          console.error('   WebSocket URL:', wsUrl)
          console.error('   ReadyState:', socket.readyState)
          setIsConnected(false)
        }

        socket.onclose = (event) => {
          console.log('❌ Time sync WebSocket disconnected', event.code)
          setIsConnected(false)
          setTimeData(prev => ({ ...prev, connected: false }))

          // Don't reconnect if we're cleaning up
          if (isCleaningUp) return

          // Show warning only once
          if (!hasShownDisconnectWarning) {
            toast.warning('⏰ Time sync lost. System running on fallback time.', {
              autoClose: 5000,
              position: 'bottom-right'
            })
            hasShownDisconnectWarning = true
          }

          // Auto-reconnect with exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`🔄 Reconnecting to time sync in ${backoffDelay / 1000}s...`)
          
          reconnectTimeout = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connectWebSocket()
          }, backoffDelay)
        }

      } catch (error) {
        console.error('❌ Error creating time sync WebSocket:', error)
        setIsConnected(false)
      }
    }

    connectWebSocket()

    // Cleanup function
    return () => {
      isCleaningUp = true
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close()
      }
    }
  }, []) // Empty dependency array - only run once on mount

  const value = {
    serverTime,        // Date object for direct use
    timeData,          // Detailed time data with all formats
    isConnected,       // Connection status
    // Helper methods
    getServerDate: () => timeData.date,
    getServerTime: () => timeData.time,
    getServerTimestamp: () => timeData.timestamp,
    isBeforeServerTime: (dateToCheck) => {
      const checkDate = new Date(dateToCheck)
      return checkDate < serverTime
    },
    isAfterServerTime: (dateToCheck) => {
      const checkDate = new Date(dateToCheck)
      return checkDate > serverTime
    }
  }

  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  )
}

// Custom hook to use server time
export const useServerTime = () => {
  const context = useContext(TimeContext)
  if (!context) {
    throw new Error('useServerTime must be used within a TimeProvider')
  }
  return context
}

export default TimeContext
