"use client";

import { useEffect, useMemo, useState } from "react";
import { TESTNET_EURC_TOKEN_ID, TESTNET_USDC_TOKEN_ID, TESTNET_XLM_TOKEN_ID } from "@/constants";
import { getApprovedTokenIds, getTokenMetadata, type TokenMetadata } from "@/utils/soroban";

export interface ApprovedToken extends TokenMetadata {
  iconLabel: string;
  logo: string;
  isAllowed: boolean;
  unavailableReason?: string;
}

const KNOWN_TOKENS: TokenMetadata[] = [
  {
    contractId: TESTNET_USDC_TOKEN_ID,
    name: "USD Coin",
    symbol: "USDC",
    decimals: 7,
  },
  {
    contractId: TESTNET_EURC_TOKEN_ID,
    name: "Euro Coin",
    symbol: "EURC",
    decimals: 7,
  },
  {
    contractId: TESTNET_XLM_TOKEN_ID,
    name: "Stellar Lumens",
    symbol: "XLM",
    decimals: 7,
  },
];

function toIconLabel(symbol: string): string {
  return symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "TK";
}

function toLogo(symbol: string): string {
  return `/tokens/${symbol.toLowerCase()}.svg`;
}

function toApprovedToken(token: TokenMetadata, allowedIds: Set<string>): ApprovedToken {
  const isAllowed = allowedIds.has(token.contractId);
  return {
    ...token,
    iconLabel: toIconLabel(token.symbol),
    logo: toLogo(token.symbol),
    isAllowed,
    unavailableReason: isAllowed ? undefined : "This token is not currently approved for ILN invoices.",
  };
}

export function useApprovedTokens() {
  const [tokens, setTokens] = useState<ApprovedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTokens() {
      setIsLoading(true);
      setError(null);

      try {
        const tokenIds = await getApprovedTokenIds();
        const metadata = await Promise.all(tokenIds.map((tokenId) => getTokenMetadata(tokenId)));
        const allowedIds = new Set(tokenIds);
        const byContractId = new Map<string, TokenMetadata>();

        KNOWN_TOKENS.forEach((token) => byContractId.set(token.contractId, token));
        metadata.forEach((token) => byContractId.set(token.contractId, token));

        if (!cancelled) {
          setTokens(Array.from(byContractId.values()).map((token) => toApprovedToken(token, allowedIds)));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load approved tokens.");
          setTokens([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTokens();

    return () => {
      cancelled = true;
    };
  }, []);

  const tokenMap = useMemo(
    () => new Map(tokens.map((token) => [token.contractId, token])),
    [tokens],
  );

  const usdcToken = tokenMap.get(TESTNET_USDC_TOKEN_ID);
  const defaultToken =
    usdcToken?.isAllowed ? usdcToken : tokens.find((token) => token.isAllowed) ?? usdcToken ?? null;

  return {
    tokens,
    tokenMap,
    defaultToken,
    isLoading,
    error,
  };
}
