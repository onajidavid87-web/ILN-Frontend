import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTokenPrice, coinGeckoId, __clearPriceCache } from "../useTokenPrice";

const fetchMock = vi.fn();

beforeEach(() => {
  __clearPriceCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function priceResponse(id: string, usd: number) {
  return { ok: true, json: async () => ({ [id]: { usd } }) } as Response;
}

describe("coinGeckoId", () => {
  it("maps known token symbols", () => {
    expect(coinGeckoId("USDC")).toBe("usd-coin");
    expect(coinGeckoId("xlm")).toBe("stellar");
  });
  it("returns null for unknown symbols", () => {
    expect(coinGeckoId("DOGE")).toBeNull();
  });
});

describe("useTokenPrice", () => {
  it("returns the fetched USD price", async () => {
    fetchMock.mockResolvedValue(priceResponse("stellar", 0.12));
    const { result } = renderHook(() => useTokenPrice("XLM"));
    await waitFor(() => expect(result.current.usdPrice).toBe(0.12));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("serves a cached price within the TTL instead of refetching", async () => {
    fetchMock.mockResolvedValue(priceResponse("usd-coin", 1));
    const first = renderHook(() => useTokenPrice("USDC"));
    await waitFor(() => expect(first.result.current.usdPrice).toBe(1));

    const second = renderHook(() => useTokenPrice("USDC"));
    await waitFor(() => expect(second.result.current.usdPrice).toBe(1));
    // Second mount is served from cache — fetch is not called again.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails soft to null on a network error", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useTokenPrice("XLM"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.usdPrice).toBeNull();
  });

  it("does not fetch for an unsupported token", async () => {
    const { result } = renderHook(() => useTokenPrice("DOGE"));
    await waitFor(() => expect(result.current.usdPrice).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
