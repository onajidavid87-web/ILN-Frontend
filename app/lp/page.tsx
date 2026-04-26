import LPDashboardPage from "@/src/screens/LPDashboard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function LPRoutePage() {
  useDocumentTitle({ pageTitle: "Fund Invoices" });

  return <LPDashboardPage />;
}
