import { apiClient } from "./client";
import type { Category } from "./types";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}
