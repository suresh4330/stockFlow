import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, Package, PackageX, WalletCards } from "lucide-react";
import { fetchDashboardCharts, fetchDashboardSummary, fetchLowStock, fetchRecentTransactions } from "@/api/dashboard";
import { fetchProducts } from "@/api/products";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { ChartCard, LegendItem } from "@/components/charts/ChartCard";
import { StockMovementChart } from "@/components/charts/StockMovementChart";
import { TopProductsBar } from "@/components/charts/TopProductsBar";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatNumber, formatRelativeDate } from "@/lib/format";
import type { LowStockItem, Product, StockTransaction } from "@/api/types";

const transactionColumns: Column<StockTransaction>[] = [
  {
    key: "type",
    header: "Type",
    width: "120px",
    render: (row) => (
      <StatusBadge
        tone={row.type === "stock_in" ? "success" : "warning"}
        label={row.type === "stock_in" ? "Stock in" : "Stock out"}
      />
    ),
  },
  {
    key: "product",
    header: "Product",
    render: (row) => <span className="font-mono text-[12px] text-zinc-500">#{row.product_id}</span>,
  },
  {
    key: "quantity",
    header: "Quantity",
    align: "right",
    render: (row) => (
      <span className="font-mono">
        {row.type === "stock_in" ? "+" : "-"}
        {formatNumber(row.quantity)}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "When",
    align: "right",
    render: (row) => <span className="text-zinc-500">{formatRelativeDate(row.created_at)}</span>,
  },
];

export function Dashboard() {
  const summary = useQuery({ queryKey: ["dashboard", "summary"], queryFn: fetchDashboardSummary });
  const charts = useQuery({ queryKey: ["dashboard", "charts"], queryFn: fetchDashboardCharts });
  const recent = useQuery({ queryKey: ["dashboard", "recent"], queryFn: fetchRecentTransactions });
  const lowStock = useQuery({ queryKey: ["dashboard", "low-stock"], queryFn: fetchLowStock });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const lowStockRows = lowStock.data ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Inventory health, recent movement, and operational signals in one place."
        meta={<span>Updated from the FastAPI backend</span>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label="Total products"
          value={summary.data?.total_products ?? 0}
          trend={{ value: 8.4, direction: "up", label: "30 days" }}
          loading={summary.isLoading}
        />
        <MetricCard
          index={1}
          label="Low stock items"
          value={summary.data?.low_stock_items ?? 0}
          trend={{ value: -2.1, direction: "down", label: "needs review" }}
          trendTone="negative"
          loading={summary.isLoading}
        />
        <MetricCard
          index={2}
          label="Out of stock"
          value={summary.data?.out_of_stock_items ?? 0}
          trend={{ value: 0, direction: "flat", label: "unchanged" }}
          loading={summary.isLoading}
        />
        <MetricCard
          index={3}
          label="Inventory value"
          value={summary.data?.total_inventory_value ?? 0}
          format={(value) => formatCurrency(value)}
          trend={{ value: 12.6, direction: "up", label: "book value" }}
          loading={summary.isLoading}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <ChartCard
          title="Stock movement"
          subtitle="Last 30 days"
          index={0}
          legend={
            <>
              <LegendItem color="#059669" label="stock in" />
              <LegendItem color="#f97316" label="stock out" />
            </>
          }
        >
          {charts.isLoading ? <Skeleton className="mx-3 h-[240px]" /> : <StockMovementChart data={charts.data?.stock_movement ?? []} />}
        </ChartCard>

        <ChartCard
          title="Low stock alerts"
          subtitle="Products at or below threshold"
          index={1}
          action={<Link to="/products" className="text-[12px] font-medium text-emerald-600">View all</Link>}
        >
          <div className="px-3 pb-2">
            {lowStock.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-9" />)}
              </div>
            ) : lowStockRows.length ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {lowStockRows.slice(0, 7).map((item) => (
                  <LowStockRow key={`${item.sku}-${item.name}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Package} title="No low stock items" description="Inventory is above minimum thresholds." />
            )}
          </div>
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Category distribution" subtitle="Products by category" index={2}>
          {charts.isLoading ? <Skeleton className="mx-3 h-[220px]" /> : <CategoryDonut data={charts.data?.category_distribution ?? []} />}
        </ChartCard>

        <ChartCard title="Recent transactions" subtitle="Latest stock changes" index={3}>
          <div className="px-3 pb-2">
            <DataTable
              columns={transactionColumns}
              rows={recent.data ?? []}
              rowKey={(row) => row.id}
              loading={recent.isLoading}
              loadingRows={6}
              empty={<EmptyState icon={PackageX} title="No transactions yet" />}
            />
          </div>
        </ChartCard>
      </section>

      <section className="mt-4">
        <ChartCard title="Top products" subtitle="Highest current stock" index={4}>
          {charts.isLoading ? <Skeleton className="mx-3 h-[240px]" /> : <TopProductsBar data={charts.data?.top_products ?? productFallback(products.data)} />}
        </ChartCard>
      </section>
    </div>
  );
}

function LowStockRow({ item }: { item: LowStockItem }) {
  const tone = item.current_stock === 0 ? "danger" : "warning";
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
        <AlertTriangle size={15} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
        <p className="font-mono text-[11px] text-zinc-500">{item.sku}</p>
      </div>
      <Badge tone={tone} className="ml-auto font-mono">
        {item.current_stock} / {item.minimum_stock}
      </Badge>
    </div>
  );
}

function productFallback(products?: Product[]) {
  return (products ?? [])
    .slice()
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 7)
    .map((product) => ({ name: product.name, sku: product.sku, stock: product.current_stock }));
}

