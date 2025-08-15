"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { Notification } from "../../types";
import Link from "next/link";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { notifications, markAsRead, refreshNotifications, unreadCount } =
    useNotifications();

  useEffect(() => {
    if (user) {
      setLoading(false); // Use context data, no need to load separately
    }
  }, [user]);

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_bid":
        return "💰";
      case "outbid":
        return "⚠️";
      case "auction_won":
        return "🏆";
      case "auction_ended":
        return "⏰";
      case "bid_accepted":
        return "✅";
      case "bid_rejected":
        return "❌";
      default:
        return "📢";
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p>You must be logged in to view notifications.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Loading notifications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Notifications{" "}
          {unreadCount > 0 && (
            <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full ml-2">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm bg-gray-200 px-3 py-1 hover:bg-gray-300 transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border p-4 transition-colors ${
                notification.read
                  ? "bg-white border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div>
                    <p className="text-sm">{notification.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      <Link
                        href={`/auction/${notification.auction_id}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Auction
                      </Link>
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead([notification.id])}
                    className="text-xs text-blue-600 hover:text-blue-800 ml-4"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
