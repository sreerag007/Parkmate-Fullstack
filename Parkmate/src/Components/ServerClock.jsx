/**
 * ServerClock Component
 * Displays real-time server time synchronized via WebSocket
 * 
 * Features:
 * - Live updating clock (updates every second)
 * - Connection status indicator
 * - Smooth pulse animation on updates
 * - Tooltip with additional info
 * - Fallback to local time if disconnected
 * 
 * Usage:
 *   <ServerClock />
 */

import React, { useState, useEffect } from 'react'
import { useServerTime } from '../contexts/TimeContext'

const ServerClock = ({ className = '', showDate = true, showTime = true, compact = false }) => {
  const { timeData, isConnected } = useServerTime()
  const [pulse, setPulse] = useState(false)

  // Trigger pulse animation on time update
  useEffect(() => {
    if (isConnected && timeData.second !== undefined) {
      setPulse(true)
      const timeout = setTimeout(() => setPulse(false), 200)
      return () => clearTimeout(timeout)
    }
  }, [timeData.second, isConnected])

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
             title={isConnected ? 'Connected to server time' : 'Disconnected - using fallback time'}
        />
        <span className="text-sm font-medium text-gray-700">
          {timeData.time || 'Loading...'}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="text-xs font-medium text-gray-500">
            {isConnected ? '🟢 Live Server Time' : '🔴 Offline Mode'}
          </span>
        </div>
        
        {/* Tooltip icon */}
        <div className="group relative">
          <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {/* Tooltip */}
          <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <p className="font-semibold mb-1">System Time Synchronization</p>
            <p className="text-gray-300 mb-2">
              All bookings, payments, and scheduling are synchronized with this real-world server time.
            </p>
            <div className="text-gray-400 text-xs">
              <p>Timezone: {timeData.timezone || 'UTC'}</p>
              <p>Timestamp: {timeData.timestamp || 'N/A'}</p>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>

      {/* Time Display */}
      <div className={`transition-all duration-200 ${pulse ? 'scale-105' : 'scale-100'}`}>
        {showDate && (
          <div className="text-sm font-medium text-gray-600 mb-1">
            {timeData.weekday ? `${timeData.weekday}, ` : ''}{timeData.date || 'Loading...'}
          </div>
        )}
        
        {showTime && (
          <div className="text-2xl font-bold text-gray-800">
            {timeData.time || 'Loading...'}
          </div>
        )}
        
        {/* 24-hour format (small) */}
        {showTime && timeData.time_24h && (
          <div className="text-xs text-gray-400 mt-1">
            {timeData.time_24h}
          </div>
        )}
      </div>

      {/* Full formatted display (optional) */}
      {!compact && timeData.formatted && (
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
          {timeData.formatted}
        </div>
      )}

      {/* Disconnected warning */}
      {!isConnected && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ Running on local fallback time
        </div>
      )}
    </div>
  )
}

export default ServerClock
