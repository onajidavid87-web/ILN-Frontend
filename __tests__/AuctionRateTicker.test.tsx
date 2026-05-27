import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AuctionRateTicker, { calculateCurrentRate } from "@/components/AuctionRateTicker";

// ─── Unit tests for rate calculation ──────────────────────────────────────────

describe("calculateCurrentRate", () => {
  const startRate = 1000;
  const minRate = 200;
  const auctionStart = 1_000_000; // unix seconds
  const duration = 3600; // 1 hour

  it("returns startRate before the auction begins", () => {
    const nowMs = (auctionStart - 1) * 1000;
    expect(calculateCurrentRate(startRate, minRate, auctionStart, duration, nowMs)).toBe(startRate);
  });

  it("returns minRate after the auction has ended", () => {
    const nowMs = (auctionStart + duration + 100) * 1000;
    expect(calculateCurrentRate(startRate, minRate, auctionStart, duration, nowMs)).toBe(minRate);
  });

  it("returns midpoint rate at 50% elapsed time", () => {
    const nowMs = (auctionStart + duration / 2) * 1000;
    const mid = calculateCurrentRate(startRate, minRate, auctionStart, duration, nowMs);
    expect(mid).toBe(600); // (1000 + 200) / 2
  });

  it("returns startRate when startRate equals minRate", () => {
    const nowMs = (auctionStart + duration / 2) * 1000;
    expect(calculateCurrentRate(500, 500, auctionStart, duration, nowMs)).toBe(500);
  });

  it("interpolates correctly at 25% elapsed", () => {
    const nowMs = (auctionStart + duration * 0.25) * 1000;
    const rate = calculateCurrentRate(startRate, minRate, auctionStart, duration, nowMs);
    expect(rate).toBe(800); // 1000 - 0.25 * (1000 - 200) = 800
  });
});

// ─── Component rendering tests ────────────────────────────────────────────────

describe("AuctionRateTicker", () => {
  const startRate = 1000;
  const minRate = 200;
  const nowSec = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders current rate and minimum rate", () => {
    render(
      <AuctionRateTicker
        startRate={startRate}
        minRate={minRate}
        auctionStartTime={nowSec - 100}
        auctionDurationSeconds={3600}
      />,
    );
    expect(screen.getByTestId("auction-rate-ticker")).toBeInTheDocument();
    expect(screen.getByTestId("current-rate")).toHaveTextContent(/bps/i);
    expect(screen.getByTestId("current-rate")).toHaveTextContent(/decreasing to 200 bps/i);
  });

  it("renders urgency countdown when auction is active", () => {
    render(
      <AuctionRateTicker
        startRate={startRate}
        minRate={minRate}
        auctionStartTime={nowSec - 60}
        auctionDurationSeconds={3600}
      />,
    );
    expect(screen.getByTestId("urgency-label")).toHaveTextContent(/Act now — rate decreases in/i);
  });

  it("shows expired message when auction is over", () => {
    render(
      <AuctionRateTicker
        startRate={startRate}
        minRate={minRate}
        auctionStartTime={nowSec - 7200}
        auctionDurationSeconds={3600}
      />,
    );
    expect(screen.getByTestId("urgency-label")).toHaveTextContent(/minimum rate/i);
  });

  it("renders a progress bar with correct aria attributes", () => {
    render(
      <AuctionRateTicker
        startRate={startRate}
        minRate={minRate}
        auctionStartTime={nowSec - 100}
        auctionDurationSeconds={3600}
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", String(startRate));
    expect(bar).toHaveAttribute("aria-valuemin", String(minRate));
  });

  it("updates the rate after a tick", () => {
    render(
      <AuctionRateTicker
        startRate={1000}
        minRate={0}
        auctionStartTime={nowSec}
        auctionDurationSeconds={1000}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(100_000); // 100 seconds
    });

    const rateEl = screen.getByTestId("current-rate");
    const bps = parseInt(rateEl.textContent ?? "9999");
    // After 100s of 1000s, rate should be ~900 (decreasing from 1000 toward 0)
    expect(bps).toBeLessThan(1000);
    expect(bps).toBeGreaterThanOrEqual(0);
  });
});
