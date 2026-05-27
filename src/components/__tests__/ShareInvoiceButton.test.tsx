import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShareInvoiceButton, {
  invoiceShareUrl,
  invoiceShareMailto,
} from "../ShareInvoiceButton";
import type { Invoice } from "@/utils/soroban";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 8n,
    status: "Pending",
    freelancer: "GFREELANCER",
    payer: "GPAYER",
    amount: 1000n,
    due_date: 0n,
    discount_rate: 300,
    ...overrides,
  } as Invoice;
}

describe("invoiceShareUrl", () => {
  it("builds the canonical detail URL", () => {
    expect(invoiceShareUrl(8n, "https://iln.app")).toBe("https://iln.app/i/8");
  });
  it("trims a trailing slash on the origin", () => {
    expect(invoiceShareUrl(8n, "https://iln.app/")).toBe("https://iln.app/i/8");
  });
});

describe("invoiceShareMailto", () => {
  it("encodes the invoice URL into a mailto link", () => {
    const link = invoiceShareMailto(8n, "https://iln.app/i/8");
    expect(link.startsWith("mailto:?subject=")).toBe(true);
    expect(link).toContain(encodeURIComponent("https://iln.app/i/8"));
    expect(link).toContain("Invoice%20%238");
  });
});

describe("ShareInvoiceButton", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it("copies the canonical link and shows a confirmation", async () => {
    render(<ShareInvoiceButton invoice={invoice()} baseUrl="https://iln.app" />);

    fireEvent.click(screen.getByRole("button", { name: /copy invoice link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://iln.app/i/8"));
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
  });

  it("offers a pre-filled mailto link", () => {
    render(<ShareInvoiceButton invoice={invoice()} baseUrl="https://iln.app" />);
    const mail = screen.getByRole("link", { name: /share invoice via email/i });
    expect(mail.getAttribute("href")).toContain(encodeURIComponent("https://iln.app/i/8"));
  });
});
