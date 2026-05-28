import type { Invoice } from "@/utils/soroban";

export const CONTRACT_EVENT_TYPES = [
  "InvoiceSubmitted",
  "InvoiceFunded",
  "InvoicePaid",
  "InvoiceDisputed",
  "InvoiceCancelled",
] as const;

export type ContractEventType = (typeof CONTRACT_EVENT_TYPES)[number];

export interface ParsedContractEvent {
  type: ContractEventType;
  invoiceId?: bigint;
  ledger?: number;
  createdAt?: string;
}

const STATUS_BY_EVENT: Record<ContractEventType, string> = {
  InvoiceSubmitted: "Pending",
  InvoiceFunded: "Funded",
  InvoicePaid: "Paid",
  InvoiceDisputed: "Disputed",
  InvoiceCancelled: "Cancelled",
};

interface HorizonContractEvent {
  type?: string;
  contract_id?: string;
  id?: string;
  topics?: string[];
  value?: string;
}

interface HorizonTransactionPayload {
  id?: string;
  hash?: string;
  ledger?: number;
  created_at?: string;
  successful?: boolean;
  events?: {
    contractEvents?: HorizonContractEvent[];
  };
}

function decodeTopicInvoiceId(topics: string[] | undefined): bigint | undefined {
  if (!topics || topics.length < 2) return undefined;
  const raw = topics[1];
  if (!raw) return undefined;
  try {
    if (/^\d+$/.test(raw)) return BigInt(raw);
    if (typeof atob === "function" && raw.length > 4) {
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      if (bytes.length >= 8) {
        let value = 0n;
        for (let i = 0; i < 8; i += 1) value = (value << 8n) | BigInt(bytes[i]);
        return value;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function parseContractEvent(
  entry: HorizonContractEvent,
  tx: HorizonTransactionPayload,
): ParsedContractEvent | null {
  const topicName = entry.topics?.[0] ?? entry.type ?? entry.id;
  if (!topicName || !CONTRACT_EVENT_TYPES.includes(topicName as ContractEventType)) {
    return null;
  }

  return {
    type: topicName as ContractEventType,
    invoiceId: decodeTopicInvoiceId(entry.topics),
    ledger: tx.ledger,
    createdAt: tx.created_at,
  };
}

/** Parse Soroban contract events from a Horizon transaction payload. */
export function parseContractEventsFromTransaction(
  tx: HorizonTransactionPayload,
): ParsedContractEvent[] {
  if (tx.successful === false) return [];

  const fromStructured =
    tx.events?.contractEvents
      ?.map((entry) => parseContractEvent(entry, tx))
      .filter((event): event is ParsedContractEvent => event !== null) ?? [];

  if (fromStructured.length > 0) return fromStructured;

  const serialized = JSON.stringify(tx);
  const fallback: ParsedContractEvent[] = [];

  for (const type of CONTRACT_EVENT_TYPES) {
    if (!serialized.includes(type)) continue;
    const match = serialized.match(new RegExp(`"(${type})"`));
    if (!match) continue;
    const idMatch = serialized.match(/"invoice_id"\s*:\s*"?(\d+)"?/);
    fallback.push({
      type,
      invoiceId: idMatch ? BigInt(idMatch[1]) : undefined,
      ledger: tx.ledger,
      createdAt: tx.created_at,
    });
  }

  return fallback;
}

export function statusForContractEvent(type: ContractEventType): string {
  return STATUS_BY_EVENT[type];
}

export function applyContractEventToInvoices(
  invoices: Invoice[] | undefined,
  event: ParsedContractEvent,
): Invoice[] | undefined {
  if (!invoices || event.invoiceId === undefined) return invoices;
  const nextStatus = statusForContractEvent(event.type);

  return invoices.map((invoice) =>
    invoice.id === event.invoiceId ? { ...invoice, status: nextStatus } : invoice,
  );
}

/** Exponential back-off delay for stream reconnect attempts. */
export function reconnectDelayMs(attempt: number, baseMs = 1000, maxMs = 30_000): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  const jitter = Math.floor(Math.random() * 250);
  return exp + jitter;
}
