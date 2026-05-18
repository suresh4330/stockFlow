import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Lock, Mail, UserPlus } from "lucide-react";
import { login, fetchMe, register, type RegisterPayload } from "@/api/auth";
import { unwrapError } from "@/api/client";
import { LogoMark } from "@/components/layout/LogoMark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusDot } from "@/components/ui/StatusDot";
import { useAuthStore } from "@/stores/auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@stockflow.local");
  const [password, setPassword] = useState("admin12345");
  const [role, setRole] = useState<RegisterPayload["role"]>("staff");

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "register") {
        await register({ name, email, password, role });
      }
      const auth = await login({ email, password });
      setToken(auth.access_token);
      const user = await fetchMe();
      setUser(user);
      return user;
    },
    onSuccess: () => {
      toast.success(mode === "register" ? "Account created" : "Signed in");
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    },
    onError: (error) => toast.error(unwrapError(error, mode === "register" ? "Could not create account" : "Could not sign in")),
  });

  if (token) return <Navigate to="/dashboard" replace />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  function switchMode(nextMode: "signin" | "register") {
    setMode(nextMode);
    setName("");
    setEmail(nextMode === "signin" ? "admin@stockflow.local" : "");
    setPassword(nextMode === "signin" ? "admin12345" : "");
    setRole("staff");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-[380px]">
        <form onSubmit={onSubmit} className="surface rounded-modal p-5">
          <div className="mb-5 flex items-center gap-3">
            <LogoMark />
            <div>
              <h1 className="text-page font-medium">{mode === "signin" ? "Sign in to StockFlow" : "Create your account"}</h1>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                {mode === "signin" ? "Inventory and DevOps control plane" : "Join the StockFlow workspace"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mode === "register" ? (
              <Input
                label="Name"
                value={name}
                leftIcon={<UserPlus size={15} />}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            ) : null}
            <Input
              label="Email"
              type="email"
              value={email}
              leftIcon={<Mail size={15} />}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              leftIcon={<Lock size={15} />}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
            {mode === "register" ? (
              <Select
                label="Role"
                value={role}
                onChange={(event) => setRole(event.target.value as RegisterPayload["role"])}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            ) : null}
          </div>

          <Button className="mt-4 w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? mode === "signin" ? "Signing in" : "Creating account"
              : mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-zinc-500">
            {mode === "signin" ? (
              <button type="button" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
                Forgot password?
              </button>
            ) : <span />}
            <button
              type="button"
              className="font-medium text-emerald-600 transition-colors hover:text-emerald-700"
              onClick={() => switchMode(mode === "signin" ? "register" : "signin")}
            >
              {mode === "signin" ? "Create account" : "Sign in instead"}
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-zinc-500">
          <span>StockFlow v1.0.0</span>
          <span>·</span>
          <StatusDot tone="success" pulse size={7} />
          <span>status: operational</span>
        </div>
      </div>
    </main>
  );
}
