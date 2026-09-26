import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/components/HistoryPage";

export const Route = createFileRoute("/_authenticated/_app/income/")({
  head: () => ({ meta: [{ title: "Income — Smart Ledger" }, { name: "description", content: "Search, filter and manage your income." }, { property: "og:title", content: "Income — Smart Ledger" }, { property: "og:description", content: "Search, filter and manage your income." }] }),
  component: () => <HistoryPage kind="income" />,
});
