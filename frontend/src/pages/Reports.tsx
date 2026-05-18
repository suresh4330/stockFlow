import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Package, Repeat, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchReport, buildReportCsv, type ReportType } from "@/api/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";

const reportTiles: Array<{ type: ReportType; label: string; description: string; icon: LucideIcon }> = [
  { type: "inventory", label: "Inventory", description: "Stock, value, and status by product", icon: Package },
  { type: "low-stock", label: "Low-stock", description: "Items at or below minimum stock", icon: FileSpreadsheet },
  { type: "suppliers", label: "Suppliers", description: "Vendor contact and product coverage", icon: Truck },
  { type: "transactions", label: "Transactions", description: "Stock movement audit trail", icon: Repeat },
];

export function Reports() {
  const [selected, setSelected] = useState<ReportType>("inventory");
  const report = useQuery({ queryKey: ["reports", selected], queryFn: () => fetchReport(selected) });
  const rows = (report.data ?? []) as Record<string, unknown>[];
  const columns = useMemo<Column<Record<string, unknown>>[]>(() => {
    const keys = Object.keys(rows[0] ?? {}).slice(0, 7);
    return keys.map((key) => ({
      key,
      header: key.replaceAll("_", " "),
      render: (row) => <span className={typeof row[key] === "number" ? "font-mono" : ""}>{String(row[key] ?? "")}</span>,
    }));
  }, [rows]);

  function exportCsv() {
    const csv = buildReportCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Exportable summaries for inventory, suppliers, and movement."
        actions={<Button leftIcon={<Download size={15} />} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reportTiles.map((tile) => (
          <button
            key={tile.type}
            type="button"
            onClick={() => setSelected(tile.type)}
            className={cn(
              "surface rounded-card p-4 text-left transition-colors duration-micro hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
              selected === tile.type && "border-emerald-600",
            )}
          >
            <tile.icon size={17} className="mb-3 text-emerald-600" />
            <h2 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">{tile.label}</h2>
            <p className="mt-1 text-[12px] text-zinc-500">{tile.description}</p>
          </button>
        ))}
      </section>

      <section className="surface mt-4 rounded-card p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-section font-medium">Preview table</h2>
            <p className="text-[12px] text-zinc-500">{rows.length} rows available</p>
          </div>
          <div className="w-48">
            <Select defaultValue="all" aria-label="Report filter">
              <option value="all">All records</option>
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => String(row.id ?? JSON.stringify(row))}
          loading={report.isLoading}
          empty={<EmptyState icon={FileSpreadsheet} title="No report data" description="Run the app with seeded data or create inventory records." />}
        />
      </section>
    </div>
  );
}
