import DashboardPage from "@/src/screens/Dashboard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function DashboardRoute() {
  useDocumentTitle({ pageTitle: "My Dashboard" });

  return <DashboardPage />;
}
