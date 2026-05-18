import { create } from "zustand";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const TOKEN_KEY = "stockflow-token";

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null,
  user: null,
  setToken: (token) => {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
