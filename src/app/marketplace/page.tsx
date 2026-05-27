"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@/context/WalletContext";
import { useInvoices } from "@/hooks/useInvoices";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { usePayerScores } from "@/hooks/usePayerScores";
import { Invoice } from "@/utils/soroban";
import { calculateYield } from "@/utils/format";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InvoiceMarketplaceCard from "@/components/InvoiceMarketplaceCard";
import FundConfirmModal from "@/components/FundConfirmModal";
const PAGE_SIZE = 20;

type SortKey = "yield" | "amount" | "due_date";

export default function MarketplacePage() {
  const { address, isConnected } = useWallet();
  const { data: allInvoices = [], isLoading: loading } = useInvoices();
  const { tokenMap, defaultToken } = useApprovedTokens();

  const [sortKey, setSortKey] = useState<SortKey>("yield");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterToken, setFilterToken] = useState("");
  const [filterMinYield, setFilterMinYield] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filter to Pending only
  const pendingInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status === "Pending"),
    [allInvoices],
  );

  // Fetch payer scores and risk levels
  const { scores: payerScores, risks: payerRisks } = usePayerScores(pendingInvoices);

  // Apply filters
  const filtered = useMemo(() => {
    let result = pendingInvoices;

    if (filterToken) {
      const tokenUpper = filterToken.toUpperCase();
      result = result.filter((inv) => {
        const sym = (tokenMap.get(inv.token ?? "")?.symbol ?? "USDC").toUpperCase();
        return sym === tokenUpper;
      });
    }

    const minYield = filterMinYield ? Number(filterMinYield) : null;
    if (minYield !== null && Number.isFinite(minYield)) {
      result = result.filter((inv) => {
        const y = Number(calculateYield(inv.amount, inv.discount_rate)) / Number(inv.amount) * 100;
        return y >= minYield;
      });
    }

    const maxAmt = filterMaxAmount ? Number(filterMaxAmount) : null;
    if (maxAmt !== null && Number.isFinite(maxAmt)) {
      result = result.filter((inv) => Number(inv.amount) / 1e6 <= maxAmt);
    }

    return result;
  }, [pendingInvoices, filterToken, filterMinYield, filterMaxAmount, tokenMap]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "yield") {
        const ya = Number(calculateYield(a.amount, a.discount_rate));
        const yb = Number(calculateYield(b.amount, b.discount_rate));
        cmp = ya - yb;
      } else if (sortKey === "amount") {
        cmp = Number(a.amount - b.amount);
      } else {
        cmp = Number(a.due_date - b.due_date);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Invoice Marketplace</h1>
          <p className="text-on-surface-variant">
            Browse pending invoices available for funding. Filter, sort, and fund invoices directly.
          </p>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-on-surface-variant">Token</label>
            <select
              value={filterToken}
              onChange={(e) => { setFilterToken(e.target.value); setPage(1); }}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="USDC">USDC</option>
              <option value="EURC">EURC</option>
              <option value="XLM">XLM</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-on-surface-variant">Min Yield %</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={filterMinYield}
              placeholder="e.g. 2.0"
              onChange={(e) => { setFilterMinYield(e.target.value); setPage(1); }}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm w-28"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-on-surface-variant">Max Amount (USDC)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={filterMaxAmount}
              placeholder="e.g. 10000"
              onChange={(e) => { setFilterMaxAmount(e.target.value); setPage(1); }}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm w-36"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            {(["yield", "amount", "due_date"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  sortKey === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                }`}
              >
                {key === "yield" ? "Yield" : key === "amount" ? "Amount" : "Due Date"}
                {sortKey === key && (sortOrder === "desc" ? " ↓" : " ↑")}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-on-surface-variant mb-4">
          {sorted.length} invoice{sorted.length !== 1 ? "s" : ""} available
        </p>

        {/* Grid */}
        {loading && paginated.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 animate-pulse">
                <div className="h-5 w-20 bg-surface-variant rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-surface-variant rounded" />
                  <div className="h-4 bg-surface-variant rounded w-3/4" />
                  <div className="h-4 bg-surface-variant rounded w-1/2" />
                </div>
                <div className="h-10 bg-surface-variant rounded mt-4" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">receipt_long</span>
            <p className="font-medium text-on-surface">No Pending Invoices</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              There are currently no invoices matching your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((invoice) => (
              <InvoiceMarketplaceCard
                key={invoice.id.toString()}
                invoice={invoice}
                tokenMap={tokenMap}
                defaultToken={defaultToken}
                payerScore={payerScores.get(invoice.payer) ?? null}
                payerRisk={payerRisks.get(invoice.payer) ?? "Unknown"}
                onFund={setSelectedInvoice}
                isWalletConnected={isConnected}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg text-sm font-bold border border-outline-variant/30 disabled:opacity-40 hover:bg-surface-variant/20"
            >
              Previous
            </button>
            <span className="text-sm text-on-surface-variant px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg text-sm font-bold border border-outline-variant/30 disabled:opacity-40 hover:bg-surface-variant/20"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />

      {/* Fund Modal */}
      <FundConfirmModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSuccess={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
