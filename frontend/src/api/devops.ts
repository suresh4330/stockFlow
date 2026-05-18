import { apiClient } from "./client";
import type { DevOpsStatus } from "./types";

export interface HealthResponse {
  status: string;
  database: string;
  service: string;
  version: string;
  environment: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
}

export async function fetchDevOpsStatus(): Promise<DevOpsStatus> {
  const { data } = await apiClient.get<DevOpsStatus>("/devops/status");
  return data;
}

export async function fetchMetrics(): Promise<string> {
  const { data } = await apiClient.get<string>("/metrics", { responseType: "text" });
  return data;
}
