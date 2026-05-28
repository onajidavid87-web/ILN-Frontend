import { describe, expect, it } from "vitest";
import {
  applyContractEventToInvoices,
  parseContractEventsFromTransaction,
  reconnectDelayMs,
} from "@/lib/contract-events";
import type { Invoice } from "@/utils/soroban";

const sampleInvoices: Invoice[] = [
  {
    id: 42n,
    status: "Pending",
    freelancer: "GFR",
    payer: "GP",
    amount: 100n,
    due_date: 1n,
    discount_rate: 100,
  },
];

describe("contract-events", () => {
  it("parses structured Horizon contract events", () => {
    const events = parseContractEventsFromTransaction({
      successful: true,
      ledger: 123,
      created_at: "2025-01-01T00:00:00Z",
      events: {
        contractEvents: [
          { topics: ["InvoiceFunded", "42"] },
        ],
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("InvoiceFunded");
    expect(events[0].invoiceId).toBe(42n);
  });

  it("updates invoice status from parsed events", () => {
    const updated = applyContractEventToInvoices(sampleInvoices, {
      type: "InvoiceFunded",
      invoiceId: 42n,
    });

    expect(updated?.[0].status).toBe("Funded");
  });

  it("uses exponential back-off for reconnect delays", () => {
    expect(reconnectDelayMs(0)).toBeGreaterThanOrEqual(1000);
    expect(reconnectDelayMs(3)).toBeGreaterThan(reconnectDelayMs(1));
    expect(reconnectDelayMs(10)).toBeLessThanOrEqual(30_250);
  });
});
