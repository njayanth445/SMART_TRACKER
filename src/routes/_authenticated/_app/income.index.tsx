import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/components/HistoryPage";

export const Route = createFileRoute("/_authenticated/_app/income/")({
  head: () => ({ meta: [{ title: "Income — Smart Ledger" }, { name: "description", content: "Search, filter and manage your income." }, { property: "og:title", content: "Income — Smart Ledger" }, { property: "og:description", content: "Search, filter and manage your income." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <HistoryPage kind="income" />,
});
