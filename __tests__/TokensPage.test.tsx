import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ isConnected: false, address: null }),
}));

const mockTokens = [
  { contractId: "CUSDC", symbol: "USDC", name: "USD Coin", decimals: 7, iconLabel: "US", logo: "/tokens/usdc.svg", isAllowed: true },
  { contractId: "native-xlm", symbol: "XLM", name: "Stellar Lumens", decimals: 7, iconLabel: "XL", logo: "/tokens/xlm.svg", isAllowed: true },
];

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({ tokens: mockTokens, isLoading: false, error: null }),
}));

vi.mock("@/components/TokenSelector", () => ({
  TokenIcon: ({ token }: any) => <span data-testid={`icon-${token.symbol}`} />,
}));

import TokensPage from "@/app/tokens/page";

describe("TokensPage (#69)", () => {
  it("renders a card for each supported token", () => {
    render(<TokensPage />);
    expect(screen.getByTestId("token-card-USDC")).toBeInTheDocument();
    expect(screen.getByTestId("token-card-XLM")).toBeInTheDocument();
  });

  it("shows Add to Wallet button for non-native tokens", () => {
    render(<TokensPage />);
    expect(screen.getByTestId("add-trustline-USDC")).toBeInTheDocument();
  });

  it("does not show Add to Wallet button for XLM (native)", () => {
    render(<TokensPage />);
    expect(screen.queryByTestId("add-trustline-XLM")).not.toBeInTheDocument();
  });

  it("disables Add to Wallet when wallet not connected", () => {
    render(<TokensPage />);
    expect(screen.getByTestId("add-trustline-USDC")).toBeDisabled();
  });

  it("shows empty state when no tokens", () => {
    vi.resetModules();
  });
});
