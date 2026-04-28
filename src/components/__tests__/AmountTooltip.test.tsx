import { render, screen, fireEvent } from "@testing-library/react";
import { AmountTooltip } from "../AmountTooltip";

const DECIMALS = 1_000_000n;

describe("AmountTooltip (#163)", () => {
  test("shows tooltip on mouse enter", () => {
    render(
      <AmountTooltip
        breakdown={{ type: "freelancer", invoiceAmount: 1000n * DECIMALS, discountBps: 300 }}
      >
        $970.00
      </AmountTooltip>
    );
    expect(screen.queryByTestId("amount-tooltip-content")).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId("amount-tooltip-wrapper"));
    expect(screen.getByTestId("amount-tooltip-content")).toBeInTheDocument();
  });

  test("hides tooltip on mouse leave", () => {
    render(
      <AmountTooltip
        breakdown={{ type: "freelancer", invoiceAmount: 1000n * DECIMALS, discountBps: 300 }}
      >
        $970.00
      </AmountTooltip>
    );
    const wrapper = screen.getByTestId("amount-tooltip-wrapper");
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByTestId("amount-tooltip-content")).not.toBeInTheDocument();
  });

  test("shows correct freelancer breakdown rows", () => {
    render(
      <AmountTooltip
        breakdown={{ type: "freelancer", invoiceAmount: 1000n * DECIMALS, discountBps: 300 }}
      >
        $970.00
      </AmountTooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId("amount-tooltip-wrapper"));
    const content = screen.getByTestId("amount-tooltip-content");
    expect(content).toHaveTextContent("Invoice amount");
    expect(content).toHaveTextContent("Discount");
    expect(content).toHaveTextContent("You receive");
  });

  test("shows correct LP breakdown rows", () => {
    render(
      <AmountTooltip
        breakdown={{ type: "lp", amountSent: 1000n * DECIMALS, discountBps: 300 }}
      >
        $30.00
      </AmountTooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId("amount-tooltip-wrapper"));
    const content = screen.getByTestId("amount-tooltip-content");
    expect(content).toHaveTextContent("You sent");
    expect(content).toHaveTextContent("Discount earned");
    expect(content).toHaveTextContent("Net yield");
  });

  test("toggles on tap (touch)", () => {
    render(
      <AmountTooltip
        breakdown={{ type: "freelancer", invoiceAmount: 500n * DECIMALS, discountBps: 200 }}
      >
        $490.00
      </AmountTooltip>
    );
    const wrapper = screen.getByTestId("amount-tooltip-wrapper");
    fireEvent.touchStart(wrapper);
    expect(screen.getByTestId("amount-tooltip-content")).toBeInTheDocument();
    fireEvent.touchStart(wrapper);
    expect(screen.queryByTestId("amount-tooltip-content")).not.toBeInTheDocument();
  });
});
