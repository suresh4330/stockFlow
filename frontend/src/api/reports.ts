import { apiClient } from "./client";

export type ReportType = "inventory" | "low-stock" | "suppliers" | "transactions";

export async function fetchReport(type: ReportType): Promise<unknown[]> {
  if (type === "suppliers") {
    const { data } = await apiClient.get("/suppliers");
    return Array.isArray(data) ? data : [];
  }
  const { data } = await apiClient.get(`/reports/${type}`);
  return Array.isArray(data) ? data : (data?.rows ?? []);
}

export function buildReportCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}
