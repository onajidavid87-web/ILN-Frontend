"use client";

import React, { useState, useEffect } from "react";

interface InvoiceStatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700",
  Funded: "bg-blue-100 text-blue-700",
  PartiallyFunded: "bg-cyan-100 text-cyan-700",
  Paid: "bg-green-100 text-green-700",
  Defaulted: "bg-red-100 text-red-700",
  Cancelled: "bg-yellow-100 text-yellow-700",
};

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (status !== currentStatus) {
      setIsChanging(true);
      const timer = setTimeout(() => {
        setCurrentStatus(status);
        setIsChanging(false);
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [status, currentStatus]);

  const style = STATUS_STYLES[currentStatus] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold
        transition-all duration-300 ease-in-out
        ${style}
        ${isChanging ? "opacity-50 scale-95" : "opacity-100 scale-100"}
      `}
    >
      {currentStatus}
    </span>
  );
}
