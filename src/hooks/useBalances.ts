"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import { getTokenBalance } from "@/utils/soroban";

export type TokenBalanceMap = Map<string, bigint>;

export function useBalances(tokens: ApprovedToken[], enabled = true) {
  const { address, isConnected, networkMismatch } = useWallet();
  const [balances, setBalances] = useState<TokenBalanceMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const balanceTokenIds = useMemo(
    () => tokens.filter((token) => token.isAllowed).map((token) => token.contractId),
    [tokens],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBalances() {
      if (!enabled || !address || !isConnected || networkMismatch || balanceTokenIds.length === 0) {
        setBalances(new Map());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const results = await Promise.allSettled(
          balanceTokenIds.map(async (contractId) => ({
            contractId,
            amount: await getTokenBalance(address, contractId),
          })),
        );

        if (cancelled) return;
        const next = new Map<string, bigint>();
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next.set(result.value.contractId, result.value.amount);
          }
        });
        setBalances(next);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBalances();

    return () => {
      cancelled = true;
    };
  }, [address, balanceTokenIds, enabled, isConnected, networkMismatch]);

  return { balances, isLoading };
}
