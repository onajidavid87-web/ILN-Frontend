export const APPEAL_WINDOW_LEDGERS = 17280;

export async function hashEvidence(text: string): Promise<string> {
  const normalized = text.trim();
  if (!normalized) return "";

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `local-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

export function formatLedgerWindow(ledgersRemaining: number): string {
  const safeLedgers = Math.max(0, Math.floor(ledgersRemaining));
  const minutes = Math.round(safeLedgers * 5 / 60);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);

  if (days > 0) return `${safeLedgers.toLocaleString()} ledgers (${days}d ${hours}h)`;
  return `${safeLedgers.toLocaleString()} ledgers (${hours}h)`;
}
