import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Plus, Truck } from "lucide-react";
import { fetchProducts } from "@/api/products";
import { fetchSuppliers } from "@/api/suppliers";
import type { Supplier } from "@/api/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatShortDate } from "@/lib/format";

export function Suppliers() {
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Vendor contacts and product coverage."
        meta={<span>{suppliers.data?.length ?? 0} suppliers connected</span>}
      />

      {suppliers.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="surface skeleton h-44 rounded-card" />)}
        </div>
      ) : suppliers.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.data.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              productCount={(products.data ?? []).filter((product) => product.supplier_id === supplier.id).length}
            />
          ))}
          <button className="flex min-h-44 flex-col items-center justify-center rounded-card border border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-zinc-700">
            <Plus size={20} />
            <span className="mt-2 text-[13px] font-medium">Add supplier</span>
          </button>
        </div>
      ) : (
        <EmptyState icon={Truck} title="No suppliers yet" description="Add suppliers to connect products with vendors." />
      )}
    </div>
  );
}

function SupplierCard({ supplier, productCount }: { supplier: Supplier; productCount: number }) {
  return (
    <article className="surface rounded-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-section font-medium text-zinc-900 dark:text-zinc-100">{supplier.company_name}</h2>
          <p className="mt-1 text-[13px] text-zinc-500">{supplier.name}</p>
        </div>
        <Badge tone="accent">{productCount} products supplied</Badge>
      </div>
      <div className="mt-5 space-y-2 text-[13px] text-zinc-600 dark:text-zinc-300">
        <p className="flex items-center gap-2"><Mail size={14} className="text-zinc-400" /> {supplier.email || "No email"}</p>
        <p className="flex items-center gap-2"><Phone size={14} className="text-zinc-400" /> {supplier.phone || "No phone"}</p>
      </div>
      <div className="mt-5 border-t border-zinc-100 pt-3 text-[12px] text-zinc-500 dark:border-zinc-800">
        Last order date: <span className="font-mono">{formatShortDate(supplier.created_at)}</span>
      </div>
    </article>
  );
}

