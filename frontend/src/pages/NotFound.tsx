import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";

export function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <EmptyState
        title="Page not found"
        description="The page you requested does not exist in this StockFlow workspace."
        action={
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded bg-emerald-600 px-3.5 text-[13px] font-medium text-white transition-colors duration-micro hover:bg-emerald-700"
          >
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
}
