import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LPDashboard from "../LPDashboard";
import React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../context/WalletContext";
import { useToast } from "../../context/ToastContext";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn().mockReturnValue("/dashboard"),
  useSearchParams: vi.fn().mockReturnValue({
    get: vi.fn(),
    toString: vi.fn().mockReturnValue(""),
  }),
}));

// Mock context hooks
vi.mock("../../context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

vi.mock("../../context/ToastContext", () => ({
  useToast: vi.fn(),
}));

// Mock soroban utils
vi.mock("../../utils/soroban", () => ({
  getAllInvoices: vi.fn().mockResolvedValue([
    { id: 1n, freelancer: "F1", payer: "P1", amount: 1000n, discount_rate: 500, due_date: 1714089600n, status: "Pending" },
    { id: 2n, freelancer: "F2", payer: "P2", amount: 2000n, discount_rate: 600, due_date: 1714176000n, status: "Pending" },
  ]),
  getTokenAllowance: vi.fn().mockResolvedValue(0n),
  getPayerScoresBatch: vi.fn().mockResolvedValue(new Map()),
  fundInvoice: vi.fn(),
  submitSignedTransaction: vi.fn(),
  Invoice: {},
}));

// Mock hooks
vi.mock("../../hooks/useApprovedTokens", () => ({
  useApprovedTokens: vi.fn().mockReturnValue({
    tokens: [],
    tokenMap: new Map(),
    defaultToken: { symbol: "USDC", contractId: "USDC_CID", decimals: 7 },
    isLoading: false,
  }),
}));

describe("LPDashboard Keyboard Shortcuts", () => {
  const pushMock = vi.fn();
  const mockWallet = {
    address: "LP1",
    isConnected: true,
    connect: vi.fn(),
    signTx: vi.fn(),
  };
  const mockToast = {
    addToast: vi.fn(),
    updateToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: pushMock,
    });
    (useWallet as any).mockReturnValue(mockWallet);
    (useToast as any).mockReturnValue(mockToast);
  });

  it("triggers handleFund on 'F' key press", async () => {
    render(<LPDashboard />);

    // Wait for invoices to load
    const row1 = await screen.findByText("#1");
    const tr = row1.closest("tr")!;

    // Focus row and press 'F'
    tr.focus();
    fireEvent.keyDown(tr, { key: "f" });

    // Should open Fund modal (which shows "Fund Invoice #1")
    expect(await screen.findByText(/Fund Invoice #1/)).toBeInTheDocument();
  });
});
