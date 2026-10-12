import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/components/HistoryPage";

export const Route = createFileRoute("/_authenticated/_app/expenses/")({
  head: () => ({ meta: [{ title: "Expenses — Smart Ledger" }, { name: "description", content: "Search, filter and manage your expenses." }, { property: "og:title", content: "Expenses — Smart Ledger" }, { property: "og:description", content: "Search, filter and manage your expenses." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <HistoryPage kind="expense" />,
});
