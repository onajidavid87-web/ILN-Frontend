"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useTransaction } from "@/hooks/useTransaction";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import TokenSelector from "@/components/TokenSelector";
import type { Invoice } from "@/utils/soroban";

interface ChangeInvoiceTokenModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: (newTokenId: string) => void;
}

export default function ChangeInvoiceTokenModal({
  invoice,
  onClose,
  onSuccess,
}: ChangeInvoiceTokenModalProps) {
  const { address } = useWallet();
  const { execute, loading } = useTransaction();
  const { tokens } = useApprovedTokens();
  const [selectedToken, setSelectedToken] = useState(invoice.token ?? "");
  const [error, setError] = useState<string | null>(null);

  const allowedTokens = tokens.filter((t) => t.isAllowed);
  const hasChanged = selectedToken !== (invoice.token ?? "");

  const handleSubmit = async () => {
    if (!address || !hasChanged || loading) return;
    setError(null);
    try {
      const { convertInvoiceToken } = await import("@/utils/soroban");
      const tx = await convertInvoiceToken(address, invoice.id, selectedToken);
      const txHash = await execute(tx, "Convert invoice token");
      if (txHash) {
        onSuccess(selectedToken);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
      data-testid="change-token-modal"
    >
      <div className="w-full max-w-md mx-4 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-dim">
          <h4 className="text-xl font-bold">Change Invoice Token</h4>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-variant/20 rounded-full text-on-surface-variant"
            aria-label="Close"
          >
            <span className="material-symbols-outlined shrink-0">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            This changes the currency your invoice is denominated in.
          </div>

          <TokenSelector
            label="New Token"
            value={selectedToken}
            tokens={allowedTokens}
            onChange={setSelectedToken}
          />

          {error && (
            <p className="text-sm text-error" role="alert">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-dim">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant/20 px-4 py-2 text-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasChanged || loading}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="confirm-change-token"
          >
            {loading ? "Confirming…" : "Confirm Change"}
          </button>
        </div>
      </div>
    </div>
  );
}
