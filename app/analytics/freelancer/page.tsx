"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import AnimatedNumber from "@/components/AnimatedNumber";
import MetricCard from "@/components/analytics/MetricCard";
import { ExportButton } from "@/components/ExportButton";
import { EmptyState } from "@/components/EmptyState";
import { FreelancerEmptyIllustration } from "@/components/illustrations/EmptyIllustrations";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getAllInvoices, Invoice } from "@/utils/soroban";
import {
  formatUSDC,
  formatAddress,
  formatDate,
} from "@/utils/format";
import {
  calculateFreelancerMetrics,
  getMonthlyInvoiceData,
  getDiscountOverTimeData,
  getPayerReliability,
  FreelancerMetrics,
  MonthlyInvoiceData,
  DiscountOverTimeData,
  PayerReliability,
} from "@/utils/freelancer-analytics";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const POLL_INTERVAL_MS = 5 * 60 * 1_000; // 5 minutes

interface LoadState {
  metrics: "loading" | "success" | "error";
  charts: "loading" | "success" | "error";
}

export default function FreelancerAnalyticsPage() {
  useDocumentTitle({ pageTitle: "Freelancer Analytics" });

  const { address, isConnected, connect } = useWallet();
  const { addToast } = useToast();

  // ─── State ────────────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({
    metrics: "loading",
    charts: "loading",
  });

  const [metrics, setMetrics] = useState<FreelancerMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyInvoiceData[]>([]);
  const [discountData, setDiscountData] = useState<DiscountOverTimeData[]>([]);
  const [payerReliability, setPayerReliability] = useState<PayerReliability[]>([]);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!address) return;

    try {
      const allInvoices = await getAllInvoices();
      setInvoices(allInvoices);

      // Calculate metrics
      const calculatedMetrics = calculateFreelancerMetrics(allInvoices, address);
      setMetrics(calculatedMetrics);
      setLoadState((prev) => ({ ...prev, metrics: "success" }));

      // Calculate chart data
      const monthly = getMonthlyInvoiceData(allInvoices, address);
      const discount = getDiscountOverTimeData(allInvoices, address);
      const reliability = getPayerReliability(allInvoices, address);

      setMonthlyData(monthly);
      setDiscountData(discount);
      setPayerReliability(reliability);
      setLoadState((prev) => ({ ...prev, charts: "success" }));
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
      setLoadState((prev) => ({
        ...prev,
        metrics: "error",
        charts: "error",
      }));
      addToast({
        type: "error",
        title: "Failed to load analytics",
        description: "Please try again later",
      });
    }
  }, [address, addToast]);

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      setMetrics(null);
      setInvoices([]);
      setMonthlyData([]);
      setDiscountData([]);
      setPayerReliability([]);
      return;
    }

    fetchData();
    pollIntervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isConnected, address, fetchData]);

  // ─── Render ───────────────────────────────────────────────────────────────

  // Not connected state
  if (!isConnected) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-surface pt-8 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="font-headline text-4xl font-bold text-on-surface">
                Freelancer Analytics
              </h1>
              <p className="mt-2 text-on-surface-variant">
                Track your invoice history, liquidity access, and payer reliability
              </p>
            </div>

            <div className="flex items-center justify-center rounded-2xl border border-outline-variant/15 bg-surface-container-lowest py-12">
              <div className="text-center">
                <p className="mb-4 text-on-surface-variant">
                  Connect your wallet to view your analytics
                </p>
                <button
                  onClick={connect}
                  className="rounded-lg bg-primary px-6 py-2 font-bold text-on-primary hover:bg-primary/90 transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Empty state (no invoices)
  if (invoices.length === 0 && loadState.metrics === "success") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-surface pt-8 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="font-headline text-4xl font-bold text-on-surface">
                Freelancer Analytics
              </h1>
              <p className="mt-2 text-on-surface-variant">
                Track your invoice history, liquidity access, and payer reliability
              </p>
            </div>

            <EmptyState
              title="No invoices submitted yet"
              description="Submit your first invoice to see analytics on your earnings and liquidity access"
              icon="article"
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Loading state
  if (!metrics || loadState.metrics === "loading") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-surface pt-8 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 animate-pulse">
              <div className="h-10 w-64 rounded bg-surface-container-low"></div>
              <div className="mt-2 h-4 w-96 rounded bg-surface-container-low"></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-surface-container-low animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Main content
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="font-headline text-4xl font-bold text-on-surface">
                Freelancer Analytics
              </h1>
              <p className="mt-2 text-on-surface-variant">
                Track your invoice history, liquidity access, and payer reliability
              </p>
            </div>
            <ExportButton
              data={invoices}
              filename="freelancer-analytics"
            />
          </div>

          {/* KPI Cards */}
          <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              id="total-invoiced"
              icon="receipt_long"
              label="Total Invoiced"
              value={
                <span className="inline-flex items-baseline gap-1">
                  <span>$</span>
                  <AnimatedNumber
                    value={Number(metrics.totalInvoiced) / 10_000_000}
                    prefix=""
                    decimals={2}
                  />
                </span>
              }
              accent
            />

            <MetricCard
              id="total-liquidity-received"
              icon="savings"
              label="Liquidity Received"
              value={
                <span className="inline-flex items-baseline gap-1">
                  <span>$</span>
                  <AnimatedNumber
                    value={Number(metrics.totalLiquidityReceived) / 10_000_000}
                    prefix=""
                    decimals={2}
                  />
                </span>
              }
            />

            <MetricCard
              id="total-discount-cost"
              icon="discount"
              label="Total Discount Cost"
              value={
                <span className="inline-flex items-baseline gap-1">
                  <span>$</span>
                  <AnimatedNumber
                    value={Number(metrics.totalDiscountCost) / 10_000_000}
                    prefix=""
                    decimals={2}
                  />
                </span>
              }
            />

            <MetricCard
              id="avg-discount-rate"
              icon="percent"
              label="Average Discount Rate"
              value={
                <AnimatedNumber
                  value={metrics.avgDiscountRate}
                  suffix="%"
                  decimals={2}
                />
              }
            />

            <MetricCard
              id="funded-rate"
              icon="check_circle"
              label="Funded Rate"
              value={
                <AnimatedNumber
                  value={metrics.fundedRate}
                  suffix="%"
                  decimals={1}
                />
              }
            />

            <MetricCard
              id="avg-time-to-funding"
              icon="schedule"
              label="Avg Time to Funding"
              value={
                metrics.avgTimeToFunding !== null
                  ? `${Math.round(metrics.avgTimeToFunding)}h`
                  : "N/A"
              }
              sub={metrics.avgTimeToFunding !== null ? "hours" : undefined}
            />
          </div>

          {/* Charts Section */}
          <div className="space-y-12">
            {/* Monthly Invoices Chart */}
            {monthlyData.length > 0 && (
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                <h2 className="mb-6 font-headline text-xl font-bold text-on-surface">
                  Monthly Invoices: Submitted vs Funded
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.1} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-surface-container)",
                          border: "1px solid var(--color-outline-variant)",
                        }}
                        labelStyle={{ color: "var(--color-on-surface)" }}
                      />
                      <Legend />
                      <Bar dataKey="submitted" fill="var(--color-primary)" />
                      <Bar dataKey="funded" fill="var(--color-secondary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Discount Over Time Chart */}
            {discountData.length > 0 && (
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                <h2 className="mb-6 font-headline text-xl font-bold text-on-surface">
                  Discount Cost Over Time
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={discountData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                        label={{ value: "USDC", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-surface-container)",
                          border: "1px solid var(--color-outline-variant)",
                        }}
                        labelStyle={{ color: "var(--color-on-surface)" }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="discountCost"
                        stroke="var(--color-error)"
                        dot={false}
                        name="Discount Cost"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Payer Reliability Table */}
            {payerReliability.length > 0 && (
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                <h2 className="mb-6 font-headline text-xl font-bold text-on-surface">
                  Payer Reliability
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Payer
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Total Invoices
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          On-Time %
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Avg Settlement Days
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Total Funded
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {payerReliability.map((payer) => (
                        <tr
                          key={payer.payer}
                          className="hover:bg-surface-container-low transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm">
                              {formatAddress(payer.payer)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {payer.totalInvoices}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">
                            <span
                              className={
                                payer.onTimeRate >= 80
                                  ? "text-green-600 dark:text-green-400"
                                  : payer.onTimeRate >= 50
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-error"
                              }
                            >
                              {payer.onTimeRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {payer.avgSettlementDays.toFixed(1)} days
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-primary">
                            ${(Number(payer.fundedAmount) / 10_000_000).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
