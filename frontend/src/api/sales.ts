import { apiClient } from "./client";
import type { SalesOrder } from "./types";

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const { data } = await apiClient.get<SalesOrder[]>("/sales");
  return data;
}

export async function fetchSalesOrder(id: number): Promise<SalesOrder> {
  const { data } = await apiClient.get<SalesOrder>(`/sales/${id}`);
  return data;
}

export async function createSalesOrder(payload: {
  customer_name: string;
  status: string;
  items: Array<{ product_id: number; quantity: number; unit_price: number }>;
}): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>("/sales", payload);
  return data;
}

export async function updateSalesOrderStatus(id: number, status: string): Promise<SalesOrder> {
  const { data } = await apiClient.put<SalesOrder>(`/sales/${id}/status`, { status });
  return data;
}
