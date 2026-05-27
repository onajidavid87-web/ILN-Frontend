"use client";

import { useState } from "react";
import type { Invoice } from "@/utils/soroban";

interface ShareInvoiceButtonProps {
  invoice: Invoice;
  /** Overrides window.location.origin (primarily for tests). */
  baseUrl?: string;
}

/** Canonical, publicly viewable URL for an invoice's detail page. */
export function invoiceShareUrl(id: bigint, origin: string): string {
  return `${origin.replace(/\/$/, "")}/i/${id.toString()}`;
}

/** Pre-populated mailto link inviting a payer to review an invoice. */
export function invoiceShareMailto(id: bigint, url: string): string {
  const subject = `Invoice #${id.toString()} on ILN`;
  const body =
    `Hi,\n\nPlease review this invoice on the Invoice Liquidity Network:\n${url}\n\nThanks.`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Lets the submitter share a deep link to an invoice (#23): copies the canonical
 * detail URL to the clipboard with a "Link copied!" confirmation, and offers a
 * "Share via email" mailto pre-filled with the link.
 */
export default function ShareInvoiceButton({ invoice, baseUrl }: ShareInvoiceButtonProps) {
  const [copied, setCopied] = useState(false);

  const origin =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = invoiceShareUrl(invoice.id, origin);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — leave the mailto option as a fallback.
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label="Copy invoice link"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[18px]">
            {copied ? "check" : "link"}
          </span>
          Share Invoice
        </button>
        {copied ? (
          <span
            role="status"
            className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-on-surface px-2.5 py-1 text-xs font-bold text-surface shadow-lg"
          >
            Link copied!
          </span>
        ) : null}
      </div>
      <a
        href={invoiceShareMailto(invoice.id, shareUrl)}
        aria-label="Share invoice via email"
        className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        <span className="material-symbols-outlined text-[18px]">mail</span>
        Email
      </a>
    </div>
  );
}
