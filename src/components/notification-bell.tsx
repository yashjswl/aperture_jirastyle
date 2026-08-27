"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
} from "@/app/(portal)/notifications/actions";
import type { Notification } from "@/generated/prisma/client";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markAsReadAction(n.id);
      // Optimistically update
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    setIsOpen(false);

    if (n.eventId) {
      router.push(`/coverages/${n.eventId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsReadAction();
    setNotifications(prev => prev.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-white/50 hover:text-white transition-colors relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white shadow-[0_0_0_2px_#000]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface-2 border border-white/10 shadow-2xl overflow-hidden z-50 flex flex-col max-h-[80vh]">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-surface/50">
            <h3 className="text-sm font-semibold text-white/90">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-white/40 font-medium">No new notifications</p>
                <p className="text-xs text-white/30 mt-1">You're all caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors flex items-start gap-3 ${!n.read ? 'bg-accent/5' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {!n.read ? (
                        <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-white/20 mt-1.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-white/90' : 'font-medium text-white/70'}`}>
                        {n.title}
                      </p>
                      <p className={`text-xs mt-1 leading-snug ${!n.read ? 'text-white/70' : 'text-white/40'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-white/30 mt-2 font-medium uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
