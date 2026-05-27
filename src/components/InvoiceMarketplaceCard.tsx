"use client";

import Link from "next/link";
import { Invoice, TokenMetadata } from "@/utils/soroban";
import { formatAddress, formatTokenAmount, calculateYield } from "@/utils/format";
import { RiskLevel, PayerScore } from "@/utils/risk";
import DueDateCountdown from "./DueDateCountdown";
import RiskBadge from "./RiskBadge";

interface InvoiceMarketplaceCardProps {
  invoice: Invoice;
  tokenMap: Map<string, TokenMetadata>;
  defaultToken: TokenMetadata | null;
  payerScore: PayerScore | null;
  payerRisk: RiskLevel;
  onFund: (invoice: Invoice) => void;
  isWalletConnected: boolean;
}

function yieldPercent(amount: bigint, discountRate: number): string {
  if (amount === 0n) return "0.00";
  const yieldAmount = calculateYield(amount, discountRate);
  return ((Number(yieldAmount) / Number(amount)) * 100).toFixed(2);
}

export default function InvoiceMarketplaceCard({
  invoice,
  tokenMap,
  defaultToken,
  payerScore,
  payerRisk,
  onFund,
  isWalletConnected,
}: InvoiceMarketplaceCardProps) {
  const token = tokenMap.get(invoice.token ?? "") ?? defaultToken;
  const tokenSymbol = token?.symbol ?? "USDC";

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-primary">#{invoice.id.toString()}</span>
          <span className="ml-2 text-xs text-on-surface-variant">{tokenSymbol}</span>
        </div>
        <RiskBadge risk={payerRisk} score={payerScore} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Amount</span>
          <span className="font-bold">{token ? formatTokenAmount(invoice.amount, token) : invoice.amount.toString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Discount</span>
          <span className="font-bold">{(invoice.discount_rate / 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Effective Yield</span>
          <span className="font-bold text-green-600">{yieldPercent(invoice.amount, invoice.discount_rate)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Due Date</span>
          <DueDateCountdown dueDate={invoice.due_date} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4">
        <span>
          Submitter:{" "}
          <Link href={`/profile/${invoice.freelancer}`} className="text-primary hover:underline font-mono">
            {formatAddress(invoice.freelancer)}
          </Link>
        </span>
        {payerScore !== null && (
          <span>Reputation: <span className="font-bold text-on-surface">{payerScore.score}</span></span>
        )}
      </div>

      {isWalletConnected ? (
        <button
          onClick={() => onFund(invoice)}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-surface-container-lowest hover:bg-primary/90 transition-all active:scale-95"
        >
          Fund Invoice
        </button>
      ) : (
        <button
          disabled
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-surface-variant text-on-surface-variant cursor-not-allowed"
        >
          Connect Wallet to Fund
        </button>
      )}
    </div>
  );
}
