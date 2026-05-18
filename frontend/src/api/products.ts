import { apiClient } from "./client";
import type { Product } from "./types";

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/products");
  return data;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data } = await apiClient.post<Product>("/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}
