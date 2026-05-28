import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import type { Invoice } from "@/utils/soroban";

const invoices: Invoice[] = [
  {
    id: 1n,
    status: "Funded",
    freelancer: "GADDR",
    payer: "GPAYER",
    funder: "GLP",
    amount: 100n,
    due_date: 1_710_000_000n,
    discount_rate: 100,
    funded_at: 1_710_000_000n,
  },
];

describe("ActivityHeatmap", () => {
  it("renders an SVG grid with accessible labels", () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);

    expect(screen.getByRole("img", { name: /activity heatmap/i })).toBeInTheDocument();
    expect(screen.getByText(/Activity heatmap/i)).toBeInTheDocument();
  });
});
