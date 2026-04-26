"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import NotificationDrawer from "./NotificationDrawer";

export default function NotificationBell() {
  const { address } = useWallet();
  const { setUnreadCount } = useNotification();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!address) return;

    const res = await fetch(
      `/api/notifications/${address}`
    );

    const data = await res.json();
    setNotifications(data);

    const unreadCount = data.filter((n: any) => !n.read).length;
    setUnreadCount(unreadCount);
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [address, setUnreadCount]);

  return (
    <div className="relative">
      {/* Bell */}
      <button onClick={() => setOpen(true)}>
        🔔
      </button>

      {/* Drawer */}
      {open && (
        <NotificationDrawer
          notifications={notifications}
          setNotifications={setNotifications}
          setUnread={setUnreadCount}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
