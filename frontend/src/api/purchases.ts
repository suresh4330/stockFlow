import { apiClient } from "./client";
import type { PurchaseOrder } from "./types";

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data } = await apiClient.get<PurchaseOrder[]>("/purchases");
  return data;
}

export async function fetchPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const { data } = await apiClient.get<PurchaseOrder>(`/purchases/${id}`);
  return data;
}

export async function createPurchaseOrder(payload: {
  supplier_id: number;
  status: string;
  items: Array<{ product_id: number; quantity: number; unit_price: number }>;
}): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>("/purchases", payload);
  return data;
}

export async function updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.put<PurchaseOrder>(`/purchases/${id}/status`, { status });
  return data;
}
