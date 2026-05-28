import { describe, expect, it } from "vitest";
import {
  buildDailyActivityCounts,
  deriveAddressActivityFromInvoices,
  formatActivityTooltip,
  getHeatmapIntensityColor,
} from "@/utils/activity-heatmap";
import type { Invoice } from "@/utils/soroban";

describe("activity-heatmap", () => {
  it("aggregates daily counts for address activity", () => {
    const now = Date.parse("2025-05-01T12:00:00Z");
    const counts = buildDailyActivityCounts(
      [
        { type: "submit", timestampMs: Date.parse("2025-04-30T10:00:00Z") },
        { type: "fund", timestampMs: Date.parse("2025-04-30T15:00:00Z") },
      ],
      now,
    );

    expect(counts.get("2025-04-30")).toBe(2);
  });

  it("derives submit, fund, and paid actions from invoices", () => {
    const invoices: Invoice[] = [
      {
        id: 1n,
        status: "Paid",
        freelancer: "GADDR",
        payer: "GOTHER",
        funder: "GADDR",
        amount: 1n,
        due_date: 1_700_000_000n,
        discount_rate: 1,
        funded_at: 1_700_000_000n,
      },
    ];

    const activity = deriveAddressActivityFromInvoices(invoices, "GADDR");
    expect(activity.length).toBeGreaterThanOrEqual(2);
  });

  it("formats tooltip copy and color scale", () => {
    expect(formatActivityTooltip(3, "2025-04-30")).toContain("3 actions");
    expect(getHeatmapIntensityColor(0, 5)).toBe("#ebedf0");
    expect(getHeatmapIntensityColor(5, 5)).toBe("#216e39");
  });
});
