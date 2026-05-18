import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, PackageSearch, SlidersHorizontal } from "lucide-react";
import { fetchProducts } from "@/api/products";
import { fetchTransactions } from "@/api/stock";
import type { Product, StockTransaction, StockTransactionType } from "@/api/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatNumber, formatRelativeDate, formatTime, groupByDate } from "@/lib/format";

type Tab = "all" | StockTransactionType;

export function StockTransactions() {
  const transactions = useQuery({ queryKey: ["stock", "transactions"], queryFn: fetchTransactions });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("all");
  const [selected, setSelected] = useState<StockTransaction | null>(null);

  const productMap = useMemo(() => new Map((products.data ?? []).map((product) => [product.id, product])), [products.data]);
  const reasons = useMemo(() => Array.from(new Set((transactions.data ?? []).map((item) => item.reason))).sort(), [transactions.data]);

  const filtered = useMemo(() => {
    return (transactions.data ?? []).filter((transaction) => {
      const product = productMap.get(transaction.product_id);
      const matchesTab = tab === "all" || transaction.type === tab;
      const matchesSearch = `${product?.name ?? ""} ${product?.sku ?? ""}`.toLowerCase().includes(search.toLowerCase());
      const matchesReason = reason === "all" || transaction.reason === reason;
      return matchesTab && matchesSearch && matchesReason;
    });
  }, [productMap, reason, search, tab, transactions.data]);

  const groups = groupByDate(filtered, (transaction) => transaction.created_at);

  return (
    <div>
      <PageHeader
        title="Stock transactions"
        subtitle="Audit trail for stock in, stock out, and inventory movement."
        meta={<span>{formatNumber(filtered.length)} records</span>}
      />

      <div className="surface mb-4 rounded-card p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex w-fit rounded border border-zinc-200 p-0.5 dark:border-zinc-800">
            {[
              ["all", "All"],
              ["stock_in", "Stock in"],
              ["stock_out", "Stock out"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value as Tab)}
                className={cn(
                  "h-8 rounded px-3 text-[12px] font-medium transition-colors",
                  tab === value
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-3 xl:min-w-[640px]">
            <Input leftIcon={<CalendarDays size={15} />} placeholder="Any date range" aria-label="Date range" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<PackageSearch size={15} />} placeholder="Search product" />
            <Select value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Reason">
              <option value="all">All reasons</option>
              {reasons.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <div className="surface rounded-card p-4">
        {transactions.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => <div key={index} className="skeleton h-12" />)}
          </div>
        ) : groups.length ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-2 text-[12px] font-medium text-zinc-500">{group.label}</h2>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {group.items.map((transaction) => {
                    const product = productMap.get(transaction.product_id);
                    return (
                      <button
                        key={transaction.id}
                        type="button"
                        onClick={() => setSelected(transaction)}
                        className="grid w-full grid-cols-[16px_minmax(0,1fr)_120px_160px_88px] items-center gap-3 px-1 py-3 text-left transition-colors duration-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      >
                        <span className={cn("h-2.5 w-2.5 rounded-full", transaction.type === "stock_in" ? "bg-emerald-500" : "bg-orange-500")} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{product?.name ?? `Product #${transaction.product_id}`}</span>
                          <span className="font-mono text-[11px] text-zinc-500">{product?.sku ?? "unknown sku"}</span>
                        </span>
                        <span className={cn("font-mono text-[13px]", transaction.type === "stock_in" ? "text-emerald-600" : "text-orange-600")}>
                          {transaction.type === "stock_in" ? "+" : "-"}
                          {formatNumber(transaction.quantity)}
                        </span>
                        <span className="truncate text-[13px] text-zinc-500">{transaction.reason}</span>
                        <span className="text-right text-[12px] text-zinc-500">{formatTime(transaction.created_at)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState icon={SlidersHorizontal} title="No transactions match" description="Adjust the filters to broaden the timeline." />
        )}
      </div>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Transaction detail">
        {selected ? <TransactionDetail transaction={selected} product={productMap.get(selected.product_id)} /> : null}
      </Drawer>
    </div>
  );
}

function TransactionDetail({ transaction, product }: { transaction: StockTransaction; product?: Product }) {
  return (
    <div className="space-y-5">
      <div>
        <StatusBadge tone={transaction.type === "stock_in" ? "success" : "warning"} label={transaction.type === "stock_in" ? "Stock in" : "Stock out"} />
        <h3 className="mt-3 text-page font-medium">{product?.name ?? `Product #${transaction.product_id}`}</h3>
        <p className="font-mono text-[12px] text-zinc-500">{product?.sku ?? "unknown sku"}</p>
      </div>
      <dl className="grid gap-3 text-[13px]">
        <Detail label="Quantity" value={`${transaction.type === "stock_in" ? "+" : "-"}${formatNumber(transaction.quantity)}`} mono />
        <Detail label="Reason" value={transaction.reason} />
        <Detail label="Created by" value={`User #${transaction.created_by}`} mono />
        <Detail label="Created" value={`${formatRelativeDate(transaction.created_at)} · ${formatTime(transaction.created_at)}`} />
      </dl>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={cn("text-zinc-900 dark:text-zinc-100", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

