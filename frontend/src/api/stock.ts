import { apiClient } from "./client";
import type { StockTransaction } from "./types";

export async function fetchTransactions(): Promise<StockTransaction[]> {
  const { data } = await apiClient.get<StockTransaction[]>("/stock/transactions");
  return data;
}

export interface StockMovementPayload {
  product_id: number;
  quantity: number;
  reason: string;
}

export async function stockIn(payload: StockMovementPayload): Promise<StockTransaction> {
  const { data } = await apiClient.post<StockTransaction>("/stock/in", payload);
  return data;
}

export async function stockOut(payload: StockMovementPayload): Promise<StockTransaction> {
  const { data } = await apiClient.post<StockTransaction>("/stock/out", payload);
  return data;
}
