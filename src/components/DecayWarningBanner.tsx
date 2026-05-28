import React from "react";
import { useReputationDecay } from "@/hooks/useReputationDecay";
import { useWallet } from "@/context/WalletContext";

export function DecayWarningBanner({ address }: { address?: string }) {
  const { address: connectedAddress } = useWallet();
  const targetAddress = address || connectedAddress;
  const { isDecaying, projectedScore30Days, currentScore, loading } = useReputationDecay(targetAddress);

  // Only show on the connected wallet's own profile/dashboard
  if (!connectedAddress || connectedAddress.toLowerCase() !== targetAddress?.toLowerCase()) {
    return null;
  }

  if (loading || !isDecaying) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 shadow-sm flex items-start gap-3">
      <span className="material-symbols-outlined mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
        warning
      </span>
      <div>
        <h3 className="font-bold text-sm">Your reputation is decaying due to inactivity. Make or receive a payment to halt decay.</h3>
        <p className="mt-1 text-xs opacity-90">
          Current score: {currentScore.toFixed(0)} • Projected score in 30 days: {projectedScore30Days.toFixed(0)}
        </p>
      </div>
    </div>
  );
}
