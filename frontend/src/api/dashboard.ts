import { apiClient } from "./client";
import type { DashboardCharts, DashboardSummary, LowStockItem, StockTransaction } from "./types";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export async function fetchDashboardCharts(): Promise<DashboardCharts> {
  const { data } = await apiClient.get<DashboardCharts>("/dashboard/charts");
  return data;
}

export async function fetchRecentTransactions(): Promise<StockTransaction[]> {
  const { data } = await apiClient.get<StockTransaction[]>("/dashboard/recent-transactions");
  return data;
}

export async function fetchLowStock(): Promise<LowStockItem[]> {
  const { data } = await apiClient.get<LowStockItem[]>("/dashboard/low-stock");
  return data;
}
