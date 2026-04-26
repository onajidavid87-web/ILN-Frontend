"use client";

export function EmptyState({ connected }: { connected: boolean }) {
  if (!connected) {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-4">
          account_balance_wallet
        </span>
        <p className="text-on-surface-variant font-medium">
          Connect your wallet to view your invoices
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-24">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-4">
        receipt_long
      </span>
      <p className="text-on-surface-variant font-medium">No invoices found</p>
    </div>
  );
}
