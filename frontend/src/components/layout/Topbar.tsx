import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { StatusDot } from "@/components/ui/StatusDot";
import { useThemeStore } from "@/stores/theme";
import { useAuth } from "@/hooks/useAuth";

export function Topbar() {
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const { user, logout } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SF";
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Signed in";

  useEffect(() => {
    if (!isAccountOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountOpen]);

  function handleLogout() {
    setIsAccountOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 dark:border-zinc-800 dark:bg-zinc-950/95">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">StockFlow</span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          v1.0.0
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/devops"
          className="hidden items-center gap-1.5 rounded px-2 py-1 text-[12px] text-zinc-600 transition-colors duration-micro hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
        >
          <StatusDot tone="success" pulse size={7} />
          All systems operational
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors duration-standard hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsAccountOpen((open) => !open)}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-zinc-900 pl-1 pr-2 text-white shadow-sm transition-colors duration-standard hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            aria-label="Open account menu"
            aria-expanded={isAccountOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full font-medium text-[12px]">
              {initials}
            </span>
            <ChevronDown
              size={14}
              className={`text-zinc-300 transition-transform duration-standard dark:text-zinc-500 ${
                isAccountOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {isAccountOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-11 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40"
            >
              <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-medium text-[12px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                      {user?.name ?? "StockFlow user"}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {user?.email ?? "No email available"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {displayRole}
                </div>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-zinc-700 transition-colors duration-micro hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <LogOut size={15} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
