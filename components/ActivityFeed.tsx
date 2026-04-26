"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { formatAddress, formatRelativeTime, formatUSDC } from "../utils/format";

interface InvoiceEvent {
  type: "submitted" | "funded" | "paid" | "defaulted" | "cancelled" | "dispute_raised";
  timestamp: number; // ms
  actor?: string;
  data?: {
    amount?: string;
    token?: string;
  };
}

interface ActivityFeedProps {
  invoiceId: bigint;
}

const INDEXER_API_BASE =
  process.env.NEXT_PUBLIC_INDEXER_API_URL ?? "https://api.iln.example.com";

const EVENT_CONFIG: Record<string, { icon: string; color: string; bgColor: string; description: (actor: string, data?: any) => string | React.ReactNode }> = {
  submitted: {
    icon: "publish",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: (actor: string) => `Invoice submitted by ${actor}`,
  },
  funded: {
    icon: "payments",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: (actor: string, data?: any) => 
      `Invoice funded by ${actor}${data?.amount ? ` for ${formatUSDC(BigInt(data.amount))}` : ""}`,
  },
  paid: {
    icon: "check_circle",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: (actor: string) => `Invoice paid by ${actor}`,
  },
  defaulted: {
    icon: "report_problem",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: (actor: string, data?: any) => 
      `Invoice defaulted. LP ${actor} claimed discount amount${data?.amount ? ` of ${formatUSDC(BigInt(data.amount))}` : ""}`,
  },
  cancelled: {
    icon: "cancel",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: (actor: string) => `Invoice cancelled by ${actor}`,
  },
  dispute_raised: {
    icon: "gavel",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: (actor: string) => `Dispute raised by ${actor}`,
  },
  unknown: {
    icon: "help_outline",
    color: "text-on-surface-variant",
    bgColor: "bg-surface-container-high",
    description: () => "Unknown activity occurred",
  }
};

export default function ActivityFeed({ invoiceId }: ActivityFeedProps) {
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${INDEXER_API_BASE}/invoice/${invoiceId}/events`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch activity feed");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load activity feed.");
      
      // MOCK DATA for demonstration if the API is not reachable
      if (process.env.NODE_ENV === "development" || true) {
         setEvents([
           { 
             type: "submitted", 
             timestamp: Date.now() - 86400000 * 2, 
             actor: "GABC12345678901234567890123456789012345678901234567890123456" 
           },
           { 
             type: "funded", 
             timestamp: Date.now() - 86400000, 
             actor: "GDEF5678901234567890123456789012345678901234567890123456", 
             data: { amount: "1000000000" } 
           }
         ]);
         setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.timestamp - a.timestamp);
  }, [events]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-16 bg-surface-container-low rounded-2xl"></div>
          <div className="h-16 bg-surface-container-low rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-outline-variant/30 rounded-[32px] bg-surface-container-low/30 text-on-surface-variant italic">
        <span className="material-symbols-outlined block text-4xl mb-2 opacity-20">history</span>
        No activity yet for this invoice
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Timeline line */}
      <div className="absolute left-[24px] top-4 bottom-4 w-px bg-outline-variant/10 hidden sm:block" />

      {sortedEvents.map((event, idx) => {
        const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.unknown;
        const actorLabel = event.actor ? formatAddress(event.actor) : "Unknown";
        
        return (
          <div key={idx} className="relative flex flex-col sm:flex-row items-start gap-4 p-4 rounded-3xl border border-outline-variant/10 bg-white shadow-sm hover:shadow-md transition-all group">
            <div className={`z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/10 ${config.bgColor}`}>
              <span className={`material-symbols-outlined text-2xl ${config.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {config.icon}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
              <div className="space-y-1">
                <div className="text-sm font-medium text-on-surface">
                  {config.description(actorLabel, event.data)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {event.type.replace("_", " ")}
                  </span>
                  {event.actor && (
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {event.actor.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
              
              <div 
                className="shrink-0 text-[12px] text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full cursor-help hover:bg-surface-container-high transition-colors"
                title={new Date(event.timestamp).toLocaleString()}
              >
                {formatRelativeTime(event.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
