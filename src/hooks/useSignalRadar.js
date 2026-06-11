import { useEffect, useState } from "react";

export function useSignalRadar(socket, activeChannelId, changeViewChannelCallback) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Ask browser for hardware desktop system notification permission on bootstrap
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingSignal = (payload) => {
      // Safety Intercept: Do not notify if the user is currently looking at that exact channel
      if (payload.channelId === activeChannelId) return;

      const newAlert = { id: String(Date.now()), ...payload };
      setAlerts((prev) => [newAlert, ...prev]);

      // Trigger Native OS Banner if window background focus settings allow it
      if (Notification.permission === "granted") {
        const osBanner = new Notification(`OUTPOST: #${payload.campsiteName}`, {
          body: `${payload.senderName}: ${payload.textPreview}`,
          icon: "/logo.webp" // Mounts your vector watchtower branding asset safely
        });
        
        osBanner.onclick = () => {
          window.focus();
          handleSelectNotification(newAlert);
        };
      }
    };

    socket.on("incoming-signal-alert", handleIncomingSignal);

    return () => socket.off("incoming-signal-alert", handleIncomingSignal);
  }, [socket, activeChannelId]);

  const handleSelectNotification = (alert) => {
    // 1. Tell your master state machine to load the target campsite and channel layout
    if (changeViewChannelCallback) {
        changeViewChannelCallback(alert.campsiteId, alert.channelId);
    }
    
    // 2. Flash Highlight Protocol: Cache target ID in storage matrix
    localStorage.setItem("highlight_message_trigger", "true");

    // 3. Remove alert from active unread array
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  return { alerts, setAlerts, handleSelectNotification };
}
