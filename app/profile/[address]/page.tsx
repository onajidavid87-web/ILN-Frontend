"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getAllInvoices,
  getReputation,
  getReputationEvents,
  type Invoice,
  type ReputationEvent,
  type ReputationScore,
} from "@/utils/soroban";
import { resolveFederatedAddress } from "@/utils/federation";
import { formatDate } from "@/utils/format";
import ProfileActivityChart from "@/components/ProfileActivityChart";
import ProfileRecentInvoices from "@/components/ProfileRecentInvoices";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { ScoreSimulator } from "@/components/profile/ScoreSimulator";
import OracleBadge from "@/components/OracleBadge";
import { DecayWarningBanner } from "@/components/DecayWarningBanner";

interface ScoreHistoryPoint {
  period: string;
  score: number;
  timestamp: number;
}

function eventTimestampMs(event: ReputationEvent): number {
  return event.timestamp > 10_000_000_000 ? event.timestamp : event.timestamp * 1000;
}

export default function ProfilePage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const [resolvedAddress, setResolvedAddress] = useState<string>(address);
  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [reputationEvents, setReputationEvents] = useState<ReputationEvent[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const [resolved, allInvoices, score, events] = await Promise.all([
          resolveFederatedAddress(address),
          getAllInvoices(),
          getReputation(address),
          getReputationEvents(address),
        ]);

        if (cancelled) return;
        setResolvedAddress(resolved);
        setInvoices(allInvoices);
        setReputation(score);
        setReputationEvents(events);
      } catch {
        if (!cancelled) {
          setError("Failed to load profile data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const submittedInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.freelancer === address),
    [invoices, address],
  );

  const payerInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.payer === address),
    [invoices, address],
  );

  const lpPositions = useMemo(
    () => invoices.filter((invoice) => invoice.funder === address),
    [invoices, address],
  );

  const recentInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.freelancer === address || invoice.payer === address)
        .sort((a, b) => {
          const aDate = Number(a.funded_at ?? a.due_date);
          const bDate = Number(b.funded_at ?? b.due_date);
          return bDate - aDate;
        })
        .slice(0, 10),
    [invoices, address],
  );

  const lastActiveInvoice = useMemo(() => {
    const relevant = invoices.filter(
      (invoice) =>
        invoice.freelancer === address ||
        invoice.payer === address ||
        invoice.funder === address,
    );
    if (relevant.length === 0) return null;
    return relevant.reduce((latest, invoice) => {
      const latestTimestamp = Number(latest.funded_at ?? latest.due_date);
      const invoiceTimestamp = Number(invoice.funded_at ?? invoice.due_date);
      return invoiceTimestamp > latestTimestamp ? invoice : latest;
    }, relevant[0]);
  }, [invoices, address]);

  const reputationSummary = useMemo<ReputationScore>(() => {
    return {
      score: reputation?.score ?? 0,
      invoices_submitted: reputation?.invoices_submitted ?? submittedInvoices.length,
      invoices_paid: reputation?.invoices_paid ?? payerInvoices.filter((invoice) => invoice.status === "Paid").length,
      invoices_defaulted:
        reputation?.invoices_defaulted ??
        payerInvoices.filter((invoice) => invoice.status === "Defaulted").length,
    };
  }, [payerInvoices, reputation, submittedInvoices.length]);

  const scoreHistory = useMemo<ScoreHistoryPoint[]>(() => {
    return reputationEvents
      .filter((event) => typeof event.score === "number")
      .map((event) => {
        const timestamp = eventTimestampMs(event);
        return {
          period: new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          score: event.score ?? 0,
          timestamp,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [reputationEvents]);

  const lastActiveLabel = loading
    ? "Loading..."
    : lastActiveInvoice
      ? formatDate(lastActiveInvoice.funded_at ?? lastActiveInvoice.due_date)
      : "No activity yet";

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
                Public reputation profile
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-on-surface">{resolvedAddress}</h1>
                <OracleBadge verified={false} />
              </div>
              <p className="mt-2 break-all font-mono text-sm text-on-surface-variant">{address}</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {resolvedAddress !== address
                  ? "Federation name resolved for this Stellar address."
                  : "No Federation name found yet."}
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container p-4 text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Last active</p>
              <p className="mt-1 text-lg font-semibold text-on-surface">{lastActiveLabel}</p>
            </div>
          </div>
          <div className="mt-4">
            <DecayWarningBanner address={address} />
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-10 text-center text-on-surface-variant">Loading profile data...</div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Reputation score" value={reputation ? reputationSummary.score : "No score"} />
              <MetricCard label="Invoices submitted" value={reputationSummary.invoices_submitted} />
              <MetricCard label="Invoices paid" value={reputationSummary.invoices_paid} />
              <MetricCard label="Invoices defaulted" value={reputationSummary.invoices_defaulted} />
            </div>
          )}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-on-surface">Role summary</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Roles are inferred from public on-chain invoices and funding activity.
                  </p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-right">
                  <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">LP positions</p>
                  <p className="mt-1 text-2xl font-semibold text-on-surface">{lpPositions.length}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <RoleCard label="Freelancer" value={`${submittedInvoices.length} invoices submitted`} />
                <RoleCard label="Payer" value={`${payerInvoices.length} invoices`} />
                <RoleCard label="LP" value={`${lpPositions.length} positions`} />
              </div>
            </section>

            {!loading && <ActivityHeatmap address={address} invoices={invoices} />}

            {scoreHistory.length > 1 ? (
              <ProfileActivityChart data={scoreHistory} />
            ) : (
              <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                <h2 className="text-xl font-semibold text-on-surface">Score history</h2>
                <p className="mt-3 text-sm text-on-surface-variant">
                  No score event history is available for this address yet.
                </p>
              </section>
            )}
          </div>

          <div className="space-y-4">
            <ScoreSimulator
              currentPaid={reputationSummary.invoices_paid}
              currentSubmitted={reputationSummary.invoices_submitted}
              currentDefaulted={reputationSummary.invoices_defaulted}
            />

            <section className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Recent invoice activity</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Most recent invoice activity as submitter or payer.
                </p>
              </div>
              <div className="mt-6">
                <ProfileRecentInvoices invoices={recentInvoices} address={address} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-outline-variant/10 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function RoleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-outline-variant/10 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}
