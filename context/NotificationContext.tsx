"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, clearUnread }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}