"use client";

import { useState } from "react";
import type { Invoice } from "@/utils/soroban";
import { downloadInvoicePdf, type InvoicePdfData } from "@/utils/invoicePdf";

interface InvoicePdfButtonProps {
  invoice: Invoice;
  data: Omit<InvoicePdfData, "shareUrl">;
  /** Overrides window.location.origin (primarily for tests). */
  baseUrl?: string;
}

/**
 * "Download PDF" action for the invoice detail page (#21). Available for all
 * invoice states; generates the PDF entirely client-side.
 */
export default function InvoicePdfButton({ invoice, data, baseUrl }: InvoicePdfButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const origin =
        baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
      await downloadInvoicePdf(invoice, {
        ...data,
        shareUrl: `${origin.replace(/\/$/, "")}/i/${invoice.id.toString()}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={busy}
      aria-label="Download invoice as PDF"
      className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
      {busy ? "Preparing..." : "Download PDF"}
    </button>
  );
}
