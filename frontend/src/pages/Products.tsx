import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MoreHorizontal, PackagePlus, Search } from "lucide-react";
import { fetchCategories } from "@/api/categories";
import { unwrapError } from "@/api/client";
import { createProduct, fetchProducts } from "@/api/products";
import { fetchSuppliers } from "@/api/suppliers";
import type { Category, Product, Supplier } from "@/api/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";

type StockFilter = "all" | "healthy" | "low" | "out";

const initialForm = {
  name: "",
  sku: "",
  category_id: "",
  supplier_id: "",
  purchase_price: "0",
  selling_price: "0",
  current_stock: "0",
  minimum_stock: "0",
  description: "",
};

export function Products() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StockFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const createMutation = useMutation({
    mutationFn: () =>
      createProduct({
        name: form.name,
        sku: form.sku,
        category_id: Number(form.category_id),
        supplier_id: Number(form.supplier_id),
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        current_stock: Number(form.current_stock),
        minimum_stock: Number(form.minimum_stock),
        description: form.description,
      }),
    onSuccess: () => {
      toast.success("Product added");
      setModalOpen(false);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(unwrapError(error, "Could not add product")),
  });

  const categoryMap = useMemo(() => mapById(categories.data), [categories.data]);
  const supplierMap = useMemo(() => mapById(suppliers.data), [suppliers.data]);
  const filtered = useMemo(() => {
    return (products.data ?? []).filter((product) => {
      const text = `${product.name} ${product.sku}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = category === "all" || product.category_id === Number(category);
      const stockStatus = getStockStatus(product).key;
      const matchesStatus = status === "all" || stockStatus === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [category, products.data, search, status]);

  const columns: Column<Product>[] = [
    {
      key: "select",
      header: <Checkbox aria-label="Select all products" />,
      width: "42px",
      render: (row) => <Checkbox aria-label={`Select ${row.name}`} />,
    },
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800">
            {row.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</p>
            <p className="font-mono text-[11px] text-zinc-500">{row.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => <span>{categoryMap.get(row.category_id)?.name ?? "Unassigned"}</span>,
    },
    {
      key: "stock",
      header: "Current stock",
      render: (row) => {
        const productStatus = getStockStatus(row);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatNumber(row.current_stock)}</span>
            <StatusBadge tone={productStatus.tone} label={productStatus.label} />
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (row) => <span className="font-mono">{formatCurrency(row.selling_price)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "64px",
      render: () => (
        <button className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" aria-label="Product actions">
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Search, filter, and manage product inventory."
        actions={<Button leftIcon={<PackagePlus size={15} />} onClick={() => setModalOpen(true)}>Add product</Button>}
      />

      <div className="surface mb-4 rounded-card p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_minmax(260px,auto)]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search size={15} />}
            placeholder="Search products or SKUs"
            aria-label="Search products"
          />
          <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "healthy", "low", "out"] as StockFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={cn(
                  "h-8 rounded px-2.5 text-[12px] font-medium transition-colors",
                  status === item
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                )}
              >
                {item === "all" ? "All" : item === "out" ? "Out" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        loading={products.isLoading}
        empty={<EmptyState title="No products found" description="Adjust filters or add a product to start tracking stock." />}
      />
      <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
        <span>{filtered.length} products</span>
        <div className="flex items-center gap-1 font-mono">
          <span>‹</span>
          <Badge>1</Badge>
          <span>2</span>
          <span>3</span>
          <span>...</span>
          <span>24</span>
          <span>›</span>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add product"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.category_id || !form.supplier_id || !form.name || !form.sku}>
              {createMutation.isPending ? "Adding" : "Add product"}
            </Button>
          </>
        }
      >
        <form className="grid gap-3" onSubmit={(event: FormEvent) => { event.preventDefault(); createMutation.mutate(); }}>
          <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input label="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Category" value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
              <option value="">Select category</option>
              {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <Select label="Supplier" value={form.supplier_id} onChange={(event) => setForm({ ...form, supplier_id: event.target.value })}>
              <option value="">Select supplier</option>
              {(suppliers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.company_name}</option>)}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Purchase price" type="number" value={form.purchase_price} onChange={(event) => setForm({ ...form, purchase_price: event.target.value })} />
            <Input label="Selling price" type="number" value={form.selling_price} onChange={(event) => setForm({ ...form, selling_price: event.target.value })} />
            <Input label="Current stock" type="number" value={form.current_stock} onChange={(event) => setForm({ ...form, current_stock: event.target.value })} />
            <Input label="Minimum stock" type="number" value={form.minimum_stock} onChange={(event) => setForm({ ...form, minimum_stock: event.target.value })} />
          </div>
          <Input label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </form>
      </Modal>
    </div>
  );
}

function mapById<T extends { id: number }>(items?: T[]) {
  return new Map((items ?? []).map((item) => [item.id, item]));
}

function getStockStatus(product: Product): { key: StockFilter; label: string; tone: "success" | "warning" | "danger" } {
  if (product.current_stock === 0) return { key: "out", label: "Out", tone: "danger" };
  if (product.current_stock <= product.minimum_stock) return { key: "low", label: "Low", tone: "warning" };
  return { key: "healthy", label: "Healthy", tone: "success" };
}

