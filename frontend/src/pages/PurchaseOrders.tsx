import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, Eye, Plus, Search, Truck, XCircle } from "lucide-react";
import { unwrapError } from "@/api/client";
import { fetchProducts } from "@/api/products";
import { createPurchaseOrder, fetchPurchaseOrders, updatePurchaseOrderStatus } from "@/api/purchases";
import { fetchSuppliers } from "@/api/suppliers";
import type { Product, PurchaseOrder, Supplier } from "@/api/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { MetricCard } from "@/components/ui/MetricCard";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/format";

type OrderStatusFilter = "all" | "pending" | "completed" | "cancelled";

interface DraftLineItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

const initialForm = {
  supplier_id: "",
  status: "pending",
  items: [] as DraftLineItem[],
};

export function PurchaseOrders() {
  const queryClient = useQueryClient();

  // Queries
  const ordersQuery = useQuery({ queryKey: ["purchases"], queryFn: fetchPurchaseOrders });
  const suppliersQuery = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  
  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [draftProduct, setDraftProduct] = useState("");
  const [draftQty, setDraftQty] = useState(1);
  const [draftPrice, setDraftPrice] = useState(0);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      createPurchaseOrder({
        supplier_id: Number(form.supplier_id),
        status: form.status,
        items: form.items.map(item => ({
          product_id: Number(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }),
    onSuccess: () => {
      toast.success("Purchase order created");
      setCreateOpen(false);
      setForm(initialForm);
      setDraftProduct("");
      setDraftQty(1);
      setDraftPrice(0);
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(unwrapError(err, "Could not create purchase order")),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updatePurchaseOrderStatus(id, status),
    onSuccess: (updated) => {
      toast.success(`Order status updated to ${updated.status}`);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(unwrapError(err, "Could not update status")),
  });

  // Mappings
  const productsMap = useMemo(() => new Map((productsQuery.data ?? []).map(p => [p.id, p])), [productsQuery.data]);
  const suppliersMap = useMemo(() => new Map((suppliersQuery.data ?? []).map(s => [s.id, s])), [suppliersQuery.data]);

  // Filter products by selected supplier (optional but elegant filter)
  const availableProducts = useMemo(() => {
    const all = productsQuery.data ?? [];
    if (!form.supplier_id) return all;
    return all.filter(p => p.supplier_id === Number(form.supplier_id));
  }, [form.supplier_id, productsQuery.data]);

  // Handle adding draft item
  const handleAddDraftItem = () => {
    if (!draftProduct) return;
    const existingIdx = form.items.findIndex(item => item.product_id === draftProduct);
    if (existingIdx > -1) {
      const updated = [...form.items];
      updated[existingIdx].quantity += draftQty;
      setForm({ ...form, items: updated });
    } else {
      setForm({
        ...form,
        items: [...form.items, { product_id: draftProduct, quantity: draftQty, unit_price: draftPrice }],
      });
    }
    setDraftProduct("");
    setDraftQty(1);
    setDraftPrice(0);
  };

  const handleRemoveDraftItem = (index: number) => {
    const updated = [...form.items];
    updated.splice(index, 1);
    setForm({ ...form, items: updated });
  };

  const handleProductSelect = (productId: string) => {
    setDraftProduct(productId);
    const prod = productsMap.get(Number(productId));
    if (prod) {
      setDraftPrice(prod.purchase_price);
    }
  };

  // Live total calculations
  const draftGrandTotal = useMemo(() => {
    return form.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [form.items]);

  // Statistics
  const stats = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    const completed = orders.filter(o => o.status === "completed");
    const totalSpend = completed.reduce((sum, o) => sum + o.total_amount, 0);
    const avgValue = completed.length ? totalSpend / completed.length : 0;
    const pending = orders.filter(o => o.status === "pending").length;

    return { totalSpend, completed: completed.length, avgValue, pending };
  }, [ordersQuery.data]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return (ordersQuery.data ?? []).filter((order) => {
      const supplier = suppliersMap.get(order.supplier_id);
      const supplierName = supplier?.company_name.toLowerCase() ?? "";
      const matchesSearch = supplierName.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ordersQuery.data, search, statusFilter, suppliersMap]);

  // Table Columns
  const columns: Column<PurchaseOrder>[] = [
    {
      key: "id",
      header: "PO Number",
      width: "110px",
      render: (row) => <span className="font-mono text-zinc-500">#{row.id}</span>,
    },
    {
      key: "supplier",
      header: "Supplier Company",
      render: (row) => {
        const sup = suppliersMap.get(row.supplier_id);
        return <span className="font-medium text-zinc-900 dark:text-zinc-100">{sup?.company_name ?? `Supplier #${row.supplier_id}`}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const tone = row.status === "completed" ? "success" : row.status === "pending" ? "warning" : "danger";
        return <StatusBadge tone={tone} label={row.status} />;
      },
    },
    {
      key: "created_at",
      header: "Date",
      render: (row) => <span className="text-zinc-500">{formatShortDate(row.created_at)}</span>,
    },
    {
      key: "items_count",
      header: "Line Items",
      render: (row) => <span>{row.items?.length ?? 0} items</span>,
    },
    {
      key: "total_amount",
      header: "Total Cost",
      align: "right",
      render: (row) => <span className="font-mono font-medium">{formatCurrency(row.total_amount)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "60px",
      render: (row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          title="View details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage supplier procurements and receive inventory stock shipments."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => { setForm(initialForm); setCreateOpen(true); }}>
            Create Purchase Order
          </Button>
        }
      />

      {/* Metrics Section */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <MetricCard
          index={0}
          label="Total Procurement Spend"
          value={stats.totalSpend}
          format={(v) => formatCurrency(v)}
          trendTone="negative"
          loading={ordersQuery.isLoading}
        />
        <MetricCard
          index={1}
          label="Completed Receipts"
          value={stats.completed}
          loading={ordersQuery.isLoading}
        />
        <MetricCard
          index={2}
          label="Pending PO Shipments"
          value={stats.pending}
          trendTone="neutral"
          loading={ordersQuery.isLoading}
        />
        <MetricCard
          index={3}
          label="Average PO Amount"
          value={stats.avgValue}
          format={(v) => formatCurrency(v)}
          loading={ordersQuery.isLoading}
        />
      </section>

      {/* Filters Section */}
      <div className="surface mb-4 rounded-card p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_minmax(320px,auto)]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            placeholder="Search by supplier company name..."
            aria-label="Search orders"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "pending", "completed", "cancelled"] as OrderStatusFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                className={cn(
                  "h-8 rounded px-2.5 text-[12px] font-medium transition-colors",
                  statusFilter === item
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                )}
              >
                {item === "all" ? "All Orders" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        rows={filteredOrders}
        rowKey={(row) => row.id}
        loading={ordersQuery.isLoading}
        empty={
          <EmptyState
            icon={Truck}
            title="No purchase orders found"
            description="Create a new purchase order to begin vendor procurement transactions."
          />
        }
      />

      {/* Create Purchase Order Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Purchase Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.supplier_id || form.items.length === 0}
            >
              {createMutation.isPending ? "Creating..." : "Save Purchase Order"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Supplier Vendor"
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value, items: [] })}
            >
              <option value="">Select a supplier</option>
              {(suppliersQuery.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name} ({s.name})
                </option>
              ))}
            </Select>

            <Select
              label="Initial Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="pending">Draft / Sent (Pending Stock Receipt)</option>
              <option value="completed">Completed / Received (Immediate Stock Replenishment)</option>
            </Select>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <h3 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 mb-2">Purchase Line Items</h3>
            
            {/* Draft Item Inputs */}
            <div className="grid gap-2 sm:grid-cols-[1.5fr_80px_100px_auto] items-end">
              <Select
                label="Product"
                value={draftProduct}
                onChange={(e) => handleProductSelect(e.target.value)}
                disabled={!form.supplier_id}
              >
                <option value="">{!form.supplier_id ? "Select supplier first" : "Select a product"}</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) — Cost: {formatCurrency(p.purchase_price)}
                  </option>
                ))}
              </Select>

              <Input
                label="Quantity"
                type="number"
                min={1}
                value={draftQty}
                onChange={(e) => setDraftQty(Math.max(1, Number(e.target.value)))}
                disabled={!form.supplier_id}
              />

              <Input
                label="Unit Cost"
                type="number"
                step="0.01"
                min={0}
                value={draftPrice}
                onChange={(e) => setDraftPrice(Math.max(0, Number(e.target.value)))}
                disabled={!form.supplier_id}
              />

              <Button
                variant="secondary"
                onClick={handleAddDraftItem}
                disabled={!draftProduct}
                className="h-9 mb-0.5"
              >
                Add Row
              </Button>
            </div>
          </div>

          {/* Draft Items List */}
          <div className="surface rounded-card p-3 max-h-48 overflow-y-auto">
            {form.items.length === 0 ? (
              <p className="text-[12px] text-zinc-500 text-center py-4">No line items added yet.</p>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="pb-1 font-medium">Product</th>
                    <th className="pb-1 text-right font-medium">Qty</th>
                    <th className="pb-1 text-right font-medium">Cost Price</th>
                    <th className="pb-1 text-right font-medium">Total</th>
                    <th className="pb-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                  {form.items.map((item, idx) => {
                    const prod = productsMap.get(Number(item.product_id));
                    return (
                      <tr key={idx} className="text-zinc-700 dark:text-zinc-300">
                        <td className="py-2.5">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{prod?.name ?? "Unknown"}</p>
                          <p className="font-mono text-[10px] text-zinc-400">{prod?.sku ?? ""}</p>
                        </td>
                        <td className="py-2.5 text-right font-mono">{formatNumber(item.quantity)}</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(item.quantity * item.unit_price)}</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftItem(idx)}
                            className="text-red-500 hover:text-red-700 text-[11px] font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <span className="text-[13px] text-zinc-500">Order Spend Total:</span>
            <span className="text-lg font-mono font-semibold text-zinc-950 dark:text-white">
              {formatCurrency(draftGrandTotal)}
            </span>
          </div>
        </div>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Purchase Order Details - #${selectedOrder.id}` : ""}
        footer={
          <div className="flex w-full items-center justify-between">
            <div>
              {selectedOrder?.status === "pending" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    leftIcon={<CheckCircle2 size={14} />}
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: "completed" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Receive Stock
                  </Button>
                  <Button
                    variant="danger"
                    leftIcon={<XCircle size={14} />}
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedOrder.id, status: "cancelled" })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Cancel Purchase
                  </Button>
                </div>
              )}
              {selectedOrder?.status === "completed" && (
                <Button
                  variant="danger"
                  leftIcon={<XCircle size={14} />}
                  onClick={() =>
                    updateStatusMutation.mutate({ id: selectedOrder.id, status: "cancelled" })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel & Reverse Stock Receipt
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid gap-3 sm:grid-cols-2 p-3 surface rounded-card border border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Supplier Vendor</p>
                <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedOrder.supplier?.company_name ?? suppliersMap.get(selectedOrder.supplier_id)?.company_name ?? `Supplier #${selectedOrder.supplier_id}`}
                </p>
                <p className="text-[12px] text-zinc-500 mt-1">
                  Drafted by User #{selectedOrder.created_by}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Status & Date</p>
                <div className="mt-1 flex sm:justify-end">
                  <StatusBadge
                    tone={
                      selectedOrder.status === "completed"
                        ? "success"
                        : selectedOrder.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                    label={selectedOrder.status}
                  />
                </div>
                <p className="text-[12px] text-zinc-500 mt-1 font-mono">
                  {formatShortDate(selectedOrder.created_at)}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Order Line Items</h4>
              <div className="surface rounded-card border border-zinc-100 dark:border-zinc-800 p-3">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                      <th className="pb-1 font-medium">Product</th>
                      <th className="pb-1 text-right font-medium">Qty</th>
                      <th className="pb-1 text-right font-medium">Cost Price</th>
                      <th className="pb-1 text-right font-medium">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                    {selectedOrder.items?.map((item) => {
                      const prod = productsMap.get(item.product_id);
                      return (
                        <tr key={item.id} className="text-zinc-700 dark:text-zinc-300">
                          <td className="py-2.5">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {prod?.name ?? `Product #${item.product_id}`}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 block">
                              {prod?.sku ?? ""}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono">{formatNumber(item.quantity)}</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(item.total_price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 px-2">
              <span className="text-[14px] font-medium text-zinc-600 dark:text-zinc-400">Total Purchase Cost:</span>
              <span className="text-xl font-mono font-bold text-zinc-950 dark:text-white">
                {formatCurrency(selectedOrder.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
