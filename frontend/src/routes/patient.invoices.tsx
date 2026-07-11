import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { Chip } from "@/components/ui-ext/DataTable";
import { Download } from "lucide-react";

export const Route = createFileRoute("/patient/invoices")({
  component: PatientInvoices,
});

const invoices = [
  { id: "INV-2402", date: "Apr 22, 2026", doctor: "Dr. Chen", amount: 240, status: "Paid" },
  { id: "INV-2401", date: "Mar 14, 2026", doctor: "Dr. Menon", amount: 320, status: "Paid" },
  { id: "INV-2400", date: "Feb 2, 2026", doctor: "Dr. Patel", amount: 180, status: "Paid" },
  { id: "INV-2399", date: "Jan 30, 2026", doctor: "Dr. Silva", amount: 145, status: "Refunded" },
];

function PatientInvoices() {
  return (
    <div>
      <PageHeader title="Invoices" description="Payment history and receipts." />
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Invoice</th>
              <th className="px-6 py-3 text-left font-medium">Date</th>
              <th className="px-6 py-3 text-left font-medium">Provider</th>
              <th className="px-6 py-3 text-left font-medium">Amount</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((i) => (
              <tr key={i.id} className="hover:bg-secondary/40">
                <td className="px-6 py-4 font-medium">{i.id}</td>
                <td className="px-6 py-4 text-ink-soft">{i.date}</td>
                <td className="px-6 py-4 text-ink-soft">{i.doctor}</td>
                <td className="px-6 py-4 font-semibold">${i.amount}</td>
                <td className="px-6 py-4">
                  <Chip tone={i.status === "Paid" ? "success" : "info"}>{i.status}</Chip>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-teal hover:underline">
                    <Download className="h-3 w-3" /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
