"use client";

import { useEffect, useState } from "react";

/**
 * Live USD price lookup for a supported token, used to preview the approximate
 * USD value of an invoice amount before submission (#22).
 *
 * Prices come from CoinGecko's public simple-price endpoint, are cached for
 * {@link PRICE_CACHE_TTL_MS} to avoid hammering the API as the user types, and
 * fail soft: on any error the hook returns `null` so callers can simply hide the
 * preview rather than surface an error.
 */

export const PRICE_CACHE_TTL_MS = 60_000;

/** Maps a token symbol to its CoinGecko coin id. */
const COINGECKO_IDS: Record<string, string> = {
  USDC: "usd-coin",
  EURC: "euro-coin",
  XLM: "stellar",
};

export function coinGeckoId(symbol: string): string | null {
  return COINGECKO_IDS[symbol.toUpperCase()] ?? null;
}

interface CacheEntry {
  price: number;
  fetchedAt: number;
}
const priceCache = new Map<string, CacheEntry>();

/** Exposed for tests; clears the module-level price cache. */
export function __clearPriceCache(): void {
  priceCache.clear();
}

async function fetchUsdPrice(symbol: string): Promise<number | null> {
  const id = coinGeckoId(symbol);
  if (!id) return null;

  const cached = priceCache.get(id);
  if (cached && Date.now() - cached.fetchedAt < PRICE_CACHE_TTL_MS) {
    return cached.price;
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
  );
  if (!response.ok) throw new Error(`Price request failed: ${response.status}`);

  const data = (await response.json()) as Record<string, { usd?: number }>;
  const price = data?.[id]?.usd;
  if (typeof price !== "number") throw new Error("Price missing from response");

  priceCache.set(id, { price, fetchedAt: Date.now() });
  return price;
}

export interface UseTokenPriceResult {
  /** USD price per 1 token, or null if unknown / failed. */
  usdPrice: number | null;
  isLoading: boolean;
}

export function useTokenPrice(symbol: string | null | undefined): UseTokenPriceResult {
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!symbol || !coinGeckoId(symbol)) {
      setUsdPrice(null);
      return;
    }

    setIsLoading(true);
    fetchUsdPrice(symbol)
      .then((price) => {
        if (!cancelled) setUsdPrice(price);
      })
      .catch(() => {
        // Fail soft — the caller hides the preview when usdPrice is null.
        if (!cancelled) setUsdPrice(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return { usdPrice, isLoading };
}
