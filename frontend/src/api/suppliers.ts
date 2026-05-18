import { apiClient } from "./client";
import type { Supplier } from "./types";

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await apiClient.get<Supplier[]>("/suppliers");
  return data;
}

export async function createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>("/suppliers", payload);
  return data;
}
