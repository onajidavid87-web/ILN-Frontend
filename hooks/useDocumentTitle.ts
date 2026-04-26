"use client";

import { useEffect, useMemo } from "react";
import { useNotification } from "../context/NotificationContext";

const BASE_TITLE = "Invoice Liquidity Network";
const SUFFIX = "· ILN";

interface UseDocumentTitleOptions {
  pageTitle?: string;
}

export function useDocumentTitle({ pageTitle }: UseDocumentTitleOptions = {}) {
  const { unreadCount } = useNotification();

  const formattedTitle = useMemo(() => {
    const base = pageTitle || BASE_TITLE;

    if (unreadCount > 0) {
      return `(${unreadCount}) ${base}`;
    }

    return base;
  }, [unreadCount, pageTitle]);

  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} ${SUFFIX}`;
    } else if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${BASE_TITLE}`;
    } else {
      document.title = BASE_TITLE;
    }
  }, [formattedTitle, pageTitle]);
}