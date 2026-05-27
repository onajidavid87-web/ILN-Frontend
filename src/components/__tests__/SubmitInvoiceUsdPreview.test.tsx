/**
 * @file SubmitInvoiceUsdPreview.test.tsx
 * Covers the live USD-equivalent preview added for issue #22.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SubmitInvoiceForm from "../SubmitInvoiceForm";

const usdPrice = { value: 0.5 as number | null };

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockResolvedValue(false),
  getAddress: vi.fn().mockResolvedValue({ address: null }),
  setAllowed: vi.fn().mockResolvedValue(false),
  signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: "x" }),
  getNetwork: vi.fn().mockResolvedValue({ network: "TESTNET" }),
}));
vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ addToast: vi.fn(() => "t"), updateToast: vi.fn() }),
}));
vi.mock("../../context/WalletContext", () => ({
  useWallet: () => ({
    address: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6",
    isConnected: true,
    networkMismatch: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTx: vi.fn(),
    error: null,
  }),
}));
vi.mock("../../utils/soroban", () => ({
  submitInvoiceTransaction: vi.fn(),
}));
const TOKEN = { symbol: "XLM", decimals: 7, contractId: "XLM_ID", isAllowed: true };
vi.mock("../../hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokens: [TOKEN],
    tokenMap: new Map([["XLM_ID", TOKEN]]),
    defaultToken: TOKEN,
    isLoading: false,
    error: null,
  }),
}));
vi.mock("../../hooks/useTokenPrice", () => ({
  useTokenPrice: () => ({ usdPrice: usdPrice.value, isLoading: false }),
}));

beforeEach(() => {
  usdPrice.value = 0.5;
});

describe("SubmitInvoiceForm USD preview (#22)", () => {
  it("shows the approximate USD value for the entered amount", () => {
    render(<SubmitInvoiceForm />);
    fireEvent.change(screen.getByPlaceholderText("5000.00"), { target: { value: "100" } });
    // 100 XLM * $0.50 = $50.00
    expect(screen.getByTestId("usd-preview")).toHaveTextContent("~ $50.00 USD");
    expect(screen.getByTestId("usd-preview")).toHaveTextContent(/approximate/i);
  });

  it("hides the preview when no price is available", () => {
    usdPrice.value = null;
    render(<SubmitInvoiceForm />);
    fireEvent.change(screen.getByPlaceholderText("5000.00"), { target: { value: "100" } });
    expect(screen.queryByTestId("usd-preview")).not.toBeInTheDocument();
  });
});
