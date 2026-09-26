import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { IncomeForm } from "@/components/TxForms";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/_app/income/add")({
  head: () => ({ meta: [{ title: "Add income — Smart Ledger" }, { name: "description", content: "Record new income." }, { property: "og:title", content: "Add income — Smart Ledger" }, { property: "og:description", content: "Record new income." }] }),
  component: () => {
    const nav = useNavigate();
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Add income" subtitle="Record money you received." />
        <Panel><IncomeForm onDone={() => nav({ to: "/income" })} /></Panel>
      </div>
    );
  },
});
