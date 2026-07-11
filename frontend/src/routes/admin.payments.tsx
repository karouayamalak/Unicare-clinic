import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ui-ext/primitives";
import { Chip, DataTable } from "@/components/ui-ext/DataTable";
import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

type Row = {
  id: string;
  patient: string;
  doctor: string;
  amount: string;
  method: string;
  date: string;
  status: string;
};

const rows: Row[] = [
  {
    id: "PY-1024",
    patient: "S. Chen",
    doctor: "Dr. Chen",
    amount: "$240",
    method: "Visa •• 4242",
    date: "Apr 22",
    status: "Succeeded",
  },
  {
    id: "PY-1023",
    patient: "M. Alvarez",
    doctor: "Dr. Menon",
    amount: "$320",
    method: "Amex •• 0005",
    date: "Apr 22",
    status: "Succeeded",
  },
  {
    id: "PY-1022",
    patient: "J. Park",
    doctor: "Dr. Patel",
    amount: "$180",
    method: "Apple Pay",
    date: "Apr 21",
    status: "Pending",
  },
  {
    id: "PY-1021",
    patient: "R. Nakamura",
    doctor: "Dr. Silva",
    amount: "$145",
    method: "Visa •• 1881",
    date: "Apr 21",
    status: "Refunded",
  },
  {
    id: "PY-1020",
    patient: "L. Diaz",
    doctor: "Dr. Tanaka",
    amount: "$210",
    method: "MC •• 3550",
    date: "Apr 20",
    status: "Succeeded",
  },
];

function AdminPayments() {
  return (
    <div>
      <PageHeader title="Payments" description="Financial operations across the clinic." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue today" value="$18,420" hint="+12%" icon={DollarSign} />
        <StatCard label="Pending payouts" value="$62,140" hint="Next: Apr 26" icon={Wallet} />
        <StatCard label="Refunds MTD" value="$1,240" hint="0.4% of volume" icon={ArrowDownRight} />
        <StatCard label="Avg. ticket" value="$228" hint="+$14 MoM" icon={ArrowUpRight} />
      </div>
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={[
            {
              key: "id",
              label: "Payment",
              render: (r) => <span className="font-medium">{r.id}</span>,
            },
            { key: "patient", label: "Patient" },
            { key: "doctor", label: "Provider" },
            {
              key: "amount",
              label: "Amount",
              render: (r) => <span className="font-semibold">{r.amount}</span>,
            },
            {
              key: "method",
              label: "Method",
              render: (r) => (
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  {r.method}
                </span>
              ),
            },
            { key: "date", label: "Date" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Chip
                  tone={
                    r.status === "Succeeded" ? "success" : r.status === "Pending" ? "warn" : "info"
                  }
                >
                  {r.status}
                </Chip>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
