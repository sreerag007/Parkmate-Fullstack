import { toast } from "react-toastify";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import React from "react";

/**
 * Trigger vibration feedback on supported devices
 * @param {number|array} pattern - Vibration duration(s) in milliseconds
 */
const vibrate = (pattern = 200) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * Global notification system with Lucide icons and optional vibration
 * Usage: notify.success("Message"), notify.error("Message"), etc.
 */
export const notify = {
  /**
   * Success notification - Green with CheckCircle icon
   * Triggers light vibration (150ms)
   */
  success: (msg) => {
    vibrate(150);
    toast.success(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle style={{ width: "20px", height: "20px", color: "#22c55e", flexShrink: 0 }} />
        <span>{msg}</span>
      </div>,
      { icon: false }
    );
  },

  /**
   * Warning notification - Yellow with AlertTriangle icon
   * Triggers light vibration (100ms)
   */
  warning: (msg) => {
    vibrate(100);
    toast.warning(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertTriangle style={{ width: "20px", height: "20px", color: "#facc15", flexShrink: 0 }} />
        <span>{msg}</span>
      </div>,
      { icon: false }
    );
  },

  /**
   * Error notification - Red with XCircle icon
   * Triggers pattern vibration [100, 50, 100]ms (stronger feedback)
   */
  error: (msg) => {
    vibrate([100, 50, 100]);
    toast.error(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <XCircle style={{ width: "20px", height: "20px", color: "#ef4444", flexShrink: 0 }} />
        <span>{msg}</span>
      </div>,
      { icon: false }
    );
  },

  /**
   * Info notification - Blue with Info icon
   * No vibration (informational only)
   */
  info: (msg) => {
    toast.info(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Info style={{ width: "20px", height: "20px", color: "#3b82f6", flexShrink: 0 }} />
        <span>{msg}</span>
      </div>,
      { icon: false }
    );
  },

  /**
   * Confirmation notification - Green with CheckCircle icon (same as success)
   * Used for booking confirmations
   */
  confirm: (msg) => {
    vibrate([150, 100, 150]);
    toast.success(
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle style={{ width: "20px", height: "20px", color: "#22c55e", flexShrink: 0 }} />
        <span>{msg}</span>
      </div>,
      { icon: false }
    );
  },
};

export default notify;
