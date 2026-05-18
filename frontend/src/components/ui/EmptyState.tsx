import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500">
          <Icon size={18} />
        </div>
      ) : null}
      <p className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
