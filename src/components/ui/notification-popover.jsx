import React, { useState } from "react";
import { Bell, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

const dummyNotifications = [
  {
    id: "1",
    senderTag: "OUTPOST HQ",
    title: "Harshit Mehta",
    description: "I AM GOOD",
    timestamp: "Now",
    read: false,
  },
  {
    id: "2",
    senderTag: "OUTPOST HQ",
    title: "Harshit Mehta",
    description: "HELLO I AM GOOD",
    timestamp: "Now",
    read: false,
  },
  {
    id: "3",
    senderTag: "HIDDEN OUTPOST",
    title: "Harshit Mehta",
    description: "hi",
    timestamp: "Now",
    read: true,
  },
];

const NotificationItem = ({
  notification,
  index,
  onMarkAsRead,
  onDismiss,
  textColor = "text-white",
  hoverBgColor = "hover:bg-[#ffffff0a]",
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    key={notification.id}
    className={cn(
      "p-3 rounded-xl border border-gray-800/50 mb-2 last:mb-0 transition-colors flex gap-3",
      notification.read ? "opacity-60" : "bg-[#11111180]",
      hoverBgColor
    )}
    onClick={() => onMarkAsRead(notification.id)}
  >
    {/* Left Icon */}
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-xl bg-[rgba(29,78,216,0.15)] border border-[rgba(29,78,216,0.3)] flex items-center justify-center text-blue-500">
        <MessageSquare size={18} />
      </div>
    </div>

    {/* Right Content */}
    <div className="flex-grow flex flex-col justify-center">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold text-blue-500 tracking-wider uppercase">
          {notification.senderTag}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">{notification.timestamp}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }} 
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <h4 className={`text-sm font-bold ${textColor}`}>
        {notification.title}
      </h4>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
        {notification.description}
      </p>
    </div>
  </motion.div>
);

const NotificationList = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  textColor,
  hoverBgColor,
}) => (
  <div className="px-2 pb-2">
    <AnimatePresence>
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          index={index}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
          textColor={textColor}
          hoverBgColor={hoverBgColor}
        />
      ))}
    </AnimatePresence>
    {notifications.length === 0 && (
      <div className="text-center py-6 text-sm text-gray-500">
        No new signals
      </div>
    )}
  </div>
);

export const NotificationPopover = ({
  notifications: initialNotifications = dummyNotifications,
  onNotificationsChange,
  buttonClassName = "w-10 h-10 rounded-[14px] bg-gray-600 hover:bg-gray-500 shadow-sm transition-colors text-white",
  popoverClassName = "bg-[#0a0a0a] border border-gray-800",
  textColor = "text-white",
  hoverBgColor = "hover:bg-[#1a1a1a]",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => setIsOpen(!isOpen);

  const clearFeed = () => {
    setNotifications([]);
    onNotificationsChange?.([]);
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    onNotificationsChange?.(updatedNotifications);
  };

  const dismiss = (id) => {
    const updatedNotifications = notifications.filter((n) => n.id !== id);
    setNotifications(updatedNotifications);
    onNotificationsChange?.(updatedNotifications);
  };

  return (
    <div className={`relative ${textColor}`}>
      <Button
        onClick={toggleOpen}
        variant="ghost"
        size="icon"
        className={cn("relative p-0 flex items-center justify-center", buttonClassName)}
      >
        <Bell size={20} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-black rounded-full flex items-center justify-center text-[12px] font-bold border-2 border-gray-600 text-white leading-none">
            {unreadCount}
          </div>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute right-0 mt-3 w-[340px] max-h-[450px] overflow-y-auto rounded-2xl shadow-2xl z-50",
              popoverClassName
            )}
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
          >
            <div className="p-4 flex justify-between items-center sticky top-0 bg-[#0a0a0a] z-10 border-b border-gray-800/50 mb-2">
              <h3 className="text-xs font-bold tracking-widest uppercase">
                INCOMING SIGNALS
              </h3>
              <button
                onClick={clearFeed}
                className="text-xs text-gray-400 hover:text-white transition-colors tracking-wide font-mono"
              >
                [ Clear Feed ]
              </button>
            </div>

            <NotificationList
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onDismiss={dismiss}
              textColor={textColor}
              hoverBgColor={hoverBgColor}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
