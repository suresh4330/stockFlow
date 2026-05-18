import { apiClient } from "./client";
import type { AuthUser } from "@/stores/auth";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  role: "admin" | "manager" | "staff";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}
