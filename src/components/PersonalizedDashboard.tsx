"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import type { WalletRole } from "@/utils/soroban";

const roleCards: Array<{
  role: WalletRole;
  title: string;
  description: string;
  href: string;
  icon: string;
}> = [
  {
    role: "freelancer",
    title: "Freelancer",
    description: "Review submitted invoices, statuses, and cancellation actions.",
    href: "/dashboard",
    icon: "receipt_long",
  },
  {
    role: "payer",
    title: "Payer",
    description: "See invoices assigned to your wallet and settlement actions.",
    href: "/payer",
    icon: "payments",
  },
  {
    role: "lp",
    title: "Liquidity Provider",
    description: "Track funded invoices, yield, and portfolio activity.",
    href: "/lp",
    icon: "account_balance",
  },
];

export default function PersonalizedDashboard() {
  const { isConnected, roles, rolesLoading } = useWallet();

  if (!isConnected) return null;

  return (
    <section className="bg-surface-container-lowest px-8 py-12 border-b border-outline-variant/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Personal dashboard</p>
            <h2 className="mt-2 text-2xl font-headline">Continue as your on-chain role</h2>
          </div>
          {rolesLoading ? (
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Detecting wallet roles...
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roleCards.map((card) => {
            const active = roles.includes(card.role);
            return (
              <Link
                key={card.role}
                href={card.href}
                className={`rounded-lg border p-5 transition-colors ${
                  active
                    ? "border-primary/40 bg-primary-container/45 shadow-sm"
                    : "border-outline-variant/15 bg-surface-container-low hover:bg-surface-container"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`material-symbols-outlined text-3xl ${active ? "text-primary" : "text-on-surface-variant"}`}
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {card.icon}
                  </span>
                  {active ? (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary">
                      Active
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-lg font-bold">{card.title}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
