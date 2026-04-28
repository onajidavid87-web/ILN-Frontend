/**
 * tourDefinitions.ts — Issue #169
 *
 * Step definitions for all four page tours.
 * Designed for react-joyride: each step has a `target` CSS selector,
 * a `title`, and `content` describing the UI element.
 */

export interface TourStep {
  target: string;
  title: string;
  content: string;
  disableBeacon?: boolean;
}

// ── Freelancer Dashboard — 6 steps ────────────────────────────────────────────

export const freelancerDashboardTour: TourStep[] = [
  {
    target: "[data-tour='submit-form']",
    title: "Submit an Invoice",
    content:
      "Fill in your invoice details here — amount, due date, and counterparty address — then submit to list it for funding.",
    disableBeacon: true,
  },
  {
    target: "[data-tour='invoice-table']",
    title: "Your Invoices",
    content:
      "All your submitted invoices appear here. Each row shows the invoice amount, due date, and current status.",
  },
  {
    target: "[data-tour='status-badges']",
    title: "Status Badges",
    content:
      "Coloured badges indicate each invoice's state: Pending, Funded, Settled, or Defaulted.",
  },
  {
    target: "[data-tour='invoice-actions']",
    title: "Invoice Actions",
    content:
      "Use the action buttons to view details, cancel a pending invoice, or initiate settlement once funded.",
  },
  {
    target: "[data-tour='notifications-bell']",
    title: "Notifications",
    content:
      "The bell icon shows recent activity. Configure alerts in Settings → Notifications.",
  },
  {
    target: "[data-tour='export-button']",
    title: "Export Data",
    content: "Download your invoice history as a CSV for accounting or tax purposes.",
  },
];

// ── LP Discovery — 5 steps ────────────────────────────────────────────────────

export const lpDiscoveryTour: TourStep[] = [
  {
    target: "[data-tour='risk-badges']",
    title: "Risk Badges",
    content:
      "Each invoice displays a risk score based on counterparty history and invoice age. Green = low risk.",
    disableBeacon: true,
  },
  {
    target: "[data-tour='yield-calculator']",
    title: "Yield Calculator",
    content:
      "Enter an amount and discount rate to preview your expected return before committing funds.",
  },
  {
    target: "[data-tour='filter-bar']",
    title: "Filter & Sort",
    content:
      "Narrow invoices by risk level, discount rate, due date, or currency to find your ideal opportunities.",
  },
  {
    target: "[data-tour='fund-flow']",
    title: "Fund an Invoice",
    content:
      "Click 'Fund' on any invoice to send USDC. You'll receive the full invoice amount at settlement.",
  },
  {
    target: "[data-tour='watchlist']",
    title: "Watchlist",
    content: "Star invoices to add them to your watchlist and monitor them without funding.",
  },
];

// ── Analytics — 4 steps ───────────────────────────────────────────────────────

export const analyticsTour: TourStep[] = [
  {
    target: "[data-tour='key-metrics']",
    title: "Key Metrics",
    content:
      "Top-line numbers show your total funded volume, average discount rate, and settlement success rate.",
    disableBeacon: true,
  },
  {
    target: "[data-tour='charts']",
    title: "Charts",
    content:
      "Visualise funding activity, yield over time, and portfolio concentration across invoice categories.",
  },
  {
    target: "[data-tour='time-filters']",
    title: "Time Filters",
    content:
      "Switch between 7-day, 30-day, 90-day, and all-time views to analyse different periods.",
  },
  {
    target: "[data-tour='export-analytics']",
    title: "Export Reports",
    content: "Download analytics as CSV or PDF for reporting to stakeholders.",
  },
];

// ── Governance — 5 steps ──────────────────────────────────────────────────────

export const governanceTour: TourStep[] = [
  {
    target: "[data-tour='proposal-list']",
    title: "Proposals",
    content:
      "Active governance proposals are listed here. Each shows the description, vote counts, and deadline.",
    disableBeacon: true,
  },
  {
    target: "[data-tour='voting']",
    title: "Cast Your Vote",
    content:
      "Click 'For' or 'Against' to vote. Votes are weighted by your ILN token balance at snapshot time.",
  },
  {
    target: "[data-tour='impact-preview']",
    title: "Impact Preview",
    content:
      "See what changes if this proposal passes — e.g. new protocol fee rate or updated risk parameters.",
  },
  {
    target: "[data-tour='health-dashboard']",
    title: "Protocol Health",
    content:
      "Key health indicators like default rate and liquidity depth are shown here to inform your vote.",
  },
  {
    target: "[data-tour='token-balance']",
    title: "Your Token Balance",
    content:
      "Your ILN token balance determines your voting power. Acquire more to increase your influence.",
  },
];

// ── Tour registry ─────────────────────────────────────────────────────────────

export type TourId =
  | "freelancer-dashboard"
  | "lp-discovery"
  | "analytics"
  | "governance";

export const TOURS: Record<TourId, { label: string; steps: TourStep[] }> = {
  "freelancer-dashboard": {
    label: "Freelancer Dashboard Tour",
    steps: freelancerDashboardTour,
  },
  "lp-discovery": {
    label: "LP Discovery Tour",
    steps: lpDiscoveryTour,
  },
  analytics: {
    label: "Analytics Tour",
    steps: analyticsTour,
  },
  governance: {
    label: "Governance Tour",
    steps: governanceTour,
  },
};
