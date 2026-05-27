import { describe, expect, it } from "vitest";
import { invoicePdfFilename, invoicePdfFields, buildInvoicePdf } from "../invoicePdf";
import type { Invoice } from "@/utils/soroban";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 12n,
    status: "Funded",
    freelancer: "GFREELANCER",
    payer: "GPAYER",
    amount: 5_000_000_000n,
    due_date: 0n,
    discount_rate: 350,
    ...overrides,
  } as Invoice;
}

const data = {
  tokenSymbol: "USDC",
  amountFormatted: "5,000.00",
  dueDateFormatted: "Jan 1, 2030",
  shareUrl: "https://iln.app/i/12",
};

describe("invoicePdfFilename", () => {
  it("uses the ILN-Invoice-[ID].pdf convention", () => {
    expect(invoicePdfFilename(12n)).toBe("ILN-Invoice-12.pdf");
  });
});

describe("invoicePdfFields", () => {
  it("includes every required invoice field", () => {
    const fields = invoicePdfFields(invoice(), data);
    const byLabel = Object.fromEntries(fields.map((f) => [f.label, f.value]));

    expect(byLabel["Invoice ID"]).toBe("#12");
    expect(byLabel["Submitter"]).toBe("GFREELANCER");
    expect(byLabel["Payer"]).toBe("GPAYER");
    expect(byLabel["Amount"]).toBe("5,000.00 USDC");
    expect(byLabel["Token"]).toBe("USDC");
    expect(byLabel["Discount Rate"]).toBe("3.50%");
    expect(byLabel["Due Date"]).toBe("Jan 1, 2030");
    expect(byLabel["Status"]).toBe("Funded");
  });
});

describe("buildInvoicePdf", () => {
  it("produces a non-empty PDF document with an embedded QR code", async () => {
    const doc = await buildInvoicePdf(invoice(), data);
    const bytes = doc.output("arraybuffer");
    expect(bytes.byteLength).toBeGreaterThan(500);
  });
});
