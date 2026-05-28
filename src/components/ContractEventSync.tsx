"use client";

import { useContractEvents } from "@/hooks/useContractEvents";

/** Subscribes to Horizon contract transaction streams for live invoice updates. */
export default function ContractEventSync() {
  useContractEvents(true);
  return null;
}
