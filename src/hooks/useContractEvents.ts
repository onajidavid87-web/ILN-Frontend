"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectHorizonTransactionStream } from "@/lib/horizon-stream";
import {
  applyContractEventToInvoices,
  type ParsedContractEvent,
} from "@/lib/contract-events";
import {
  isContractEventStreamingActive,
  setContractEventStreamingActive,
} from "@/lib/contract-event-stream-state";
import type { Invoice } from "@/utils/soroban";

function patchInvoiceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  event: ParsedContractEvent,
) {
  queryClient.setQueryData<Invoice[]>(["invoices"], (current) =>
    applyContractEventToInvoices(current, event),
  );

  if (event.invoiceId !== undefined) {
    queryClient.setQueryData<Invoice>(["invoice", event.invoiceId.toString()], (current) => {
      if (!current) return current;
      const updated = applyContractEventToInvoices([current], event);
      return updated?.[0] ?? current;
    });
    queryClient.invalidateQueries({ queryKey: ["invoice", event.invoiceId.toString()] });
  }
}

export function useContractEvents(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const handle = connectHorizonTransactionStream({
      onEvent: (event) => patchInvoiceQueries(queryClient, event),
      onStatusChange: (status) => {
        setContractEventStreamingActive(status === "connected");
      },
    });

    return () => {
      handle.close();
      setContractEventStreamingActive(false);
    };
  }, [enabled, queryClient]);
}

export { isContractEventStreamingActive };
