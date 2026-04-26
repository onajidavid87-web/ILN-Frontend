"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllInvoices, getInvoice, fundInvoice, submitSignedTransaction, Invoice } from "../utils/soroban";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";

const TERMINAL_STATUSES = ["Paid", "Defaulted", "Cancelled"];

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: getAllInvoices,
    refetchInterval: (query) => {
      const data = query.state.data as Invoice[] | undefined;
      if (!data) return 15000;
      
      const hasActiveInvoices = data.some(
        (invoice) => !TERMINAL_STATUSES.includes(invoice.status)
      );
      
      return hasActiveInvoices ? 15000 : false;
    },
  });
}

export function useInvoice(id: bigint | null) {
  return useQuery({
    queryKey: ["invoice", id?.toString()],
    queryFn: () => (id ? getInvoice(id) : Promise.reject("Invalid ID")),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as Invoice | undefined;
      if (!data) return 15000;
      return TERMINAL_STATUSES.includes(data.status) ? false : 15000;
    },
  });
}

export function useFundInvoice() {
  const queryClient = useQueryClient();
  const { address, signTx } = useWallet();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: bigint) => {
      if (!address || !signTx) throw new Error("Wallet not connected");
      
      const tx = await fundInvoice(address, invoiceId);
      return submitSignedTransaction({ tx, signTx });
    },
    onMutate: async (invoiceId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["invoices"] });

      // Snapshot the previous value
      const previousInvoices = queryClient.getQueryData<Invoice[]>(["invoices"]);

      // Optimistically update to the new value
      if (previousInvoices) {
        queryClient.setQueryData<Invoice[]>(["invoices"], (old) =>
          old?.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: "Funded" } : inv
          )
        );
      }

      return { previousInvoices };
    },
    onError: (err, invoiceId, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(["invoices"], context.previousInvoices);
      }
      addToast({
        type: "error",
        title: "Funding failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync with the chain
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Invoice funded successfully!",
      });
    },
  });
}
