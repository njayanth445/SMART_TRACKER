import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExpenseForm } from "@/components/TxForms";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/_app/expenses/add")({
  head: () => ({ meta: [{ title: "Add expense — Smart Ledger" }, { name: "description", content: "Record a new expense." }, { property: "og:title", content: "Add expense — Smart Ledger" }, { property: "og:description", content: "Record a new expense." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => {
    const nav = useNavigate();
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Add expense" subtitle="Record what you spent." />
        <Panel><ExpenseForm onDone={() => nav({ to: "/expenses" })} /></Panel>
      </div>
    );
  },
});
