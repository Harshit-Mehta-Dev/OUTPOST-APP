import { useEffect, useState } from "react";

export function useSignalRadar(socket, activeChannelId, changeViewChannelCallback, currentUser) {
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('outpost_radar_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('outpost_radar_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    // Ask browser for hardware desktop system notification permission on bootstrap
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Fetch persistent system alerts (like decommission warnings)
  useEffect(() => {
    if (!currentUser || !currentUser.username) return;

    fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/users/${currentUser.username}/alerts`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mappedAlerts = data.map(sysAlert => ({
            id: sysAlert._id,
            campsiteName: sysAlert.campsiteName,
            senderName: "SYSTEM OVERRIDE",
            textPreview: sysAlert.message,
            campsiteId: 1, // Fallback routing to HQ
            channelId: '1_community-chat'
          }));
          setAlerts(prev => {
            // Filter out already fetched to avoid duplicates
            const existingIds = prev.map(a => a.id);
            const newAlerts = mappedAlerts.filter(a => !existingIds.includes(a.id));
            return [...newAlerts, ...prev];
          });
        }
      })
      .catch(err => console.error("Failed to load system alerts:", err));
  }, [currentUser?.username]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingSignal = (payload) => {
      // Safety Intercept: Do not notify if the normal user is currently looking at that exact channel
      const isGlobalAdmin = currentUser?.email?.toLowerCase()?.trim() === 'harshitmehta1012@gmail.com';
      if (!isGlobalAdmin && payload.channelId === activeChannelId) return;

      const newAlert = { id: String(Date.now()), ...payload };
      setAlerts((prev) => [newAlert, ...prev]);

      // Trigger Native OS Banner if window background focus settings allow it
      if (Notification.permission === "granted") {
        const osBanner = new Notification(`OUTPOST: #${payload.campsiteName}`, {
          body: `${payload.senderName}: ${payload.textPreview}`,
          icon: "/logo.png" // Mounts your vector watchtower branding asset safely
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
        changeViewChannelCallback(alert);
    }
    
    // 2. Flash Highlight Protocol: Cache target ID in storage matrix
    localStorage.setItem("highlight_message_trigger", "true");
    
    // 3. (Removed) Notifications now persist until manually cleared
    
    // 4. If it's a system override alert, delete it from the backend so it doesn't return
    if (alert.senderName === "SYSTEM OVERRIDE" && currentUser?.username) {
       fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/users/${currentUser.username}/alerts`, { method: 'DELETE' })
         .catch(err => console.error("Error clearing system alerts:", err));
    }
  };

  return { alerts, setAlerts, handleSelectNotification };
}
