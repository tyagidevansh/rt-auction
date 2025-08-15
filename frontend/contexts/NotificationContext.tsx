"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { API_ENDPOINTS } from "../lib/api";
import { Notification } from "../types";
import { useSocket } from "../hooks/useSocket";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS}?user_id=${user.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: notificationIds }),
      });

      if (response.ok) {
        // Update local state to mark notifications as read
        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // set up polling as backup (can be longer interval now)
      const interval = setInterval(fetchNotifications, 60000); // [oll every minute
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  // listen for real-time notification events
  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (data: {
        userId: string;
        notification: Notification;
      }) => {
        if (data.userId === user.id) {
          console.log("Received new notification:", data.notification);
          setNotifications((prev) => [data.notification, ...prev]);
        }
      };

      socket.on("new_notification", handleNewNotification);

      return () => {
        socket.off("new_notification", handleNewNotification);
      };
    }
  }, [socket, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
