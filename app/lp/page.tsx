"use client";

import { Suspense } from "react";
import LPDashboardPage from "@/src/screens/LPDashboard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function LPRoutePage() {
  useDocumentTitle({ pageTitle: "Fund Invoices" });

  return (
    <Suspense fallback={null}>
      <LPDashboardPage />
    </Suspense>
  );
}

