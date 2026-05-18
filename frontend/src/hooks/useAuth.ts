import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchMe } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (query.data && query.data !== user) {
      setUser(query.data);
    }
  }, [query.data, setUser, user]);

  return {
    token,
    user: query.data ?? user,
    isAuthenticated: Boolean(token),
    isLoading: Boolean(token) && query.isLoading,
    logout,
  };
}
