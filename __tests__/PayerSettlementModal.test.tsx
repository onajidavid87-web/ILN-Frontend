import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PayerSettlementModal from "../src/components/PayerSettlementModal";
import { Invoice, TokenMetadata } from "../src/utils/soroban";

// Mock utilities
vi.mock("../src/utils/soroban", () => ({
  getTokenAllowance: vi.fn(() => Promise.resolve(0n)),
  getUsdcAllowance: vi.fn(() => Promise.resolve(0n)),
  CONTRACT_ID: "CONTRACT_123",
}));

vi.mock("../src/utils/format", () => ({
  formatTokenAmount: (v: bigint) => (Number(v) / 10 ** 7).toString(),
  formatAddress: (a: string) => a.slice(0, 4),
}));

vi.mock("../src/utils/invoiceSubmission", () => ({
  parseAmountToUnits: (v: string) => BigInt(Number(v) * 10 ** 7),
}));

// Mock TokenIcon since it's a separate component that might have its own logic
vi.mock("../src/components/TokenSelector", () => ({
  TokenIcon: () => <div data-testid="token-icon" />,
}));

describe("PayerSettlementModal", () => {
  const mockInvoice: Invoice = {
    id: 123n,
    status: "Funded",
    freelancer: "FREELANCER",
    payer: "PAYER",
    amount: 10000000000n, // 1000 USDC
    due_date: 999999n,
    discount_rate: 500, // 5%
    funder: "LP_HOLDER",
  };

  const mockToken: TokenMetadata = {
    contractId: "TOKEN_ID",
    name: "USDC",
    symbol: "USDC",
    decimals: 7,
  };

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correct invoice information", () => {
    render(
      <PayerSettlementModal
        invoice={mockInvoice}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        submitting={false}
      />
    );

    expect(screen.getByText(/Settle Invoice #123/)).toBeInTheDocument();
    expect(screen.getByText("LP_H")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("defaults to full amount", () => {
    render(
      <PayerSettlementModal
        invoice={mockInvoice}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        submitting={false}
      />
    );

    // Full amount is 1000
    // LP earnings (5%) is 1000 * 5% = 50
    expect(screen.getByText("1000 USDC")).toBeInTheDocument();
    expect(screen.getByText("+ 50 USDC")).toBeInTheDocument();
  });

  it("allows switching to partial payment", async () => {
    render(
      <PayerSettlementModal
        invoice={mockInvoice}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        submitting={false}
      />
    );

    const partialBtn = screen.getByText("Partial");
    fireEvent.click(partialBtn);

    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "500" } });

    // Amount to pay is 500
    // LP earnings is 500 * 5% = 25
    await waitFor(() => {
      expect(screen.getByText("500 USDC")).toBeInTheDocument();
    });
    expect(screen.getByText("+ 25 USDC")).toBeInTheDocument();
  });

  it("calls onConfirm with the correct amount", async () => {
    render(
      <PayerSettlementModal
        invoice={mockInvoice}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        submitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Payment")).not.toBeDisabled();
    });

    const confirmBtn = screen.getByText("Confirm Payment");
    fireEvent.click(confirmBtn);

    expect(mockOnConfirm).toHaveBeenCalledWith(10000000000n);
  });

  it("validates partial amount does not exceed invoice amount", () => {
    render(
      <PayerSettlementModal
        invoice={mockInvoice}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        submitting={false}
      />
    );

    fireEvent.click(screen.getByText("Partial"));
    const input = screen.getByPlaceholderText("0.00");
    fireEvent.change(input, { target: { value: "2000" } }); // Exceeds 1000

    expect(screen.getByText("1000 USDC")).toBeInTheDocument(); // Caps at 1000
  });
});
