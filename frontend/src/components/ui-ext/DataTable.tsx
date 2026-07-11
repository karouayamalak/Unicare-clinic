import type { ReactNode } from "react";

export function DataTable<T extends { id: string }>({
  columns,
  rows,
}: {
  columns: {
    key: keyof T | string;
    label: string;
    render?: (row: T) => ReactNode;
    className?: string;
  }[];
  rows: T[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-6 py-3 text-left font-medium ${c.className ?? ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-secondary/40">
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-6 py-4 align-middle ${c.className ?? ""}`}>
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key as string] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warn" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-ink-soft",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
