"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ActivityFeed from "@/components/ActivityFeed";
import CancelInvoiceButton from "@/components/CancelInvoiceButton";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import { useWallet } from "@/context/WalletContext";
import { formatAddress, formatDate, formatUSDC } from "@/utils/format";
import { getInvoice, type Invoice } from "@/utils/soroban";

type LoadState = "loading" | "success" | "error";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, connect } = useWallet();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const invoiceId = BigInt(id);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoadState("loading");
      setInvoice(await getInvoice(invoiceId));
      setLoadState("success");
    } catch {
      setError("Failed to load invoice details.");
      setLoadState("error");
    }
  }, [invoiceId]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

  if (loadState === "loading") {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant/30 border-t-primary" />
        </div>
      </main>
    );
  }

  if (loadState === "error" || !invoice) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <section className="px-4 pt-32 text-center">
          <h1 className="text-2xl font-headline">Invoice Not Found</h1>
          <p className="mt-2 text-on-surface-variant">{error || "The requested invoice does not exist."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="px-6 pb-10 pt-32 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Invoice Detail</p>
              <h1 className="mt-2 text-3xl font-headline">Invoice #{invoice.id.toString()}</h1>
            </div>
            {!address ? (
              <button
                type="button"
                onClick={connect}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary"
              >
                Connect Wallet
              </button>
            ) : (
              <CancelInvoiceButton
                invoice={invoice}
                walletAddress={address}
                onCancelled={(cancelled) => setInvoice(cancelled)}
              />
            )}
          </div>

          <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/10 pb-4">
              <div>
                <p className="text-sm text-on-surface-variant">Current status</p>
                <div className="mt-2">
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </div>
              <Link href="/dashboard" className="text-sm font-bold text-primary hover:underline">
                Back to dashboard
              </Link>
            </div>

            <dl className="mt-6 grid gap-4 text-sm">
              <DetailRow label="Freelancer" href={`/profile/${invoice.freelancer}`} value={formatAddress(invoice.freelancer)} />
              <DetailRow label="Payer" href={`/profile/${invoice.payer}`} value={formatAddress(invoice.payer)} />
              {invoice.funder ? (
                <DetailRow label="Liquidity Provider" href={`/profile/${invoice.funder}`} value={formatAddress(invoice.funder)} />
              ) : null}
              <DetailRow label="Face value" value={formatUSDC(invoice.amount)} strong />
              <DetailRow label="Discount" value={`${(invoice.discount_rate / 100).toFixed(2)}%`} />
              <DetailRow label="Due date" value={formatDate(invoice.due_date)} />
            </dl>
          </article>

          <ActivityFeed invoiceId={invoiceId} />
        </div>
      </section>
      <Footer />
    </main>
  );
}

function DetailRow({
  label,
  value,
  href,
  strong,
}: {
  label: string;
  value: string;
  href?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 pb-3 last:border-b-0">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={strong ? "font-bold" : "font-mono text-sm"}>
        {href ? (
          <Link href={href} className="text-primary hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
