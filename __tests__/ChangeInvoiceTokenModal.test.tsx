import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockExecute = vi.fn();

vi.mock("@/hooks/useTransaction", () => ({
  useTransaction: () => ({ execute: mockExecute, loading: false, error: null }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GSELF000000000000000000000000000000000000000000000000000000" }),
}));

const USDC = "CUSDC0000000000000000000000000000000000000000000000000000";
const EURC = "CEURC0000000000000000000000000000000000000000000000000000";

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokens: [
      { contractId: USDC, symbol: "USDC", name: "USD Coin", decimals: 7, iconLabel: "US", logo: "/tokens/usdc.svg", isAllowed: true },
      { contractId: EURC, symbol: "EURC", name: "Euro Coin", decimals: 7, iconLabel: "EU", logo: "/tokens/eurc.svg", isAllowed: true },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/utils/soroban", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/soroban")>();
  return { ...actual, convertInvoiceToken: vi.fn().mockResolvedValue("mock-tx") };
});

vi.mock("@stellar/stellar-sdk", () => ({
  TransactionBuilder: vi.fn(),
  Operation: { invokeContractFunction: vi.fn() },
  Address: { fromString: vi.fn(() => ({ toScVal: vi.fn() })) },
  nativeToScVal: vi.fn(),
  BASE_FEE: "100",
  rpc: {
    Server: vi.fn(() => ({
      getAccount: vi.fn().mockResolvedValue({}),
      simulateTransaction: vi.fn().mockResolvedValue({ result: {} }),
    })),
    Api: { isSimulationSuccess: vi.fn(() => true) },
    assembleTransaction: vi.fn(() => ({ build: vi.fn(() => "assembled-tx") })),
  },
}));

vi.mock("@/constants", () => ({
  CONTRACT_ID: "CTEST",
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  RPC_URL: "https://soroban-testnet.stellar.org",
  TESTNET_USDC_TOKEN_ID: USDC,
  TESTNET_EURC_TOKEN_ID: EURC,
  TESTNET_XLM_TOKEN_ID: "CXLM0000000000000000000000000000000000000000000000000000",
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import ChangeInvoiceTokenModal from "@/components/ChangeInvoiceTokenModal";
import type { Invoice } from "@/utils/soroban";

const baseInvoice: Invoice = {
  id: 5n,
  freelancer: "GFR1",
  payer: "GPAYER1",
  amount: 1_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 200,
  status: "Pending",
  token: USDC,
};

function renderModal(overrides: Partial<Invoice> = {}, onSuccess = vi.fn(), onClose = vi.fn()) {
  return render(
    <ChangeInvoiceTokenModal
      invoice={{ ...baseInvoice, ...overrides }}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ChangeInvoiceTokenModal", () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it("renders with the current token pre-selected", () => {
    renderModal();
    expect(screen.getByTestId("change-token-modal")).toBeInTheDocument();
    expect(screen.getByText(/Change Invoice Token/i)).toBeInTheDocument();
  });

  it("shows the currency warning message", () => {
    renderModal();
    expect(screen.getByText(/currency your invoice is denominated in/i)).toBeInTheDocument();
  });

  it("Confirm Change button is disabled when no token change", () => {
    renderModal();
    const btn = screen.getByTestId("confirm-change-token");
    expect(btn).toBeDisabled();
  });

  it("Confirm Change button enables after selecting a different token", async () => {
    renderModal();
    // Select EURC (different from the pre-selected USDC)
    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: EURC } });
    expect(screen.getByTestId("confirm-change-token")).not.toBeDisabled();
  });

  it("calls execute and invokes onSuccess with new token on submit", async () => {
    mockExecute.mockResolvedValue("tx-hash-xyz");
    const onSuccess = vi.fn();
    renderModal({}, onSuccess);

    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: EURC } });
    fireEvent.click(screen.getByTestId("confirm-change-token"));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(EURC));
  });

  it("does not call onSuccess when execute returns null", async () => {
    mockExecute.mockResolvedValue(null);
    const onSuccess = vi.fn();
    renderModal({}, onSuccess);

    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: EURC } });
    fireEvent.click(screen.getByTestId("confirm-change-token"));

    await waitFor(() => expect(mockExecute).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    renderModal({}, vi.fn(), onClose);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when X button is clicked", () => {
    const onClose = vi.fn();
    renderModal({}, vi.fn(), onClose);
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error message when transaction throws", async () => {
    mockExecute.mockRejectedValue(new Error("User rejected transaction"));
    renderModal();

    const selector = screen.getByRole("combobox");
    fireEvent.change(selector, { target: { value: EURC } });
    fireEvent.click(screen.getByTestId("confirm-change-token"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/User rejected transaction/i);
  });
});
