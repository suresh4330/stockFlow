import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  index?: number;
}

export function ChartCard({
  title,
  subtitle,
  legend,
  action,
  children,
  className,
  index = 0,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn("surface rounded-card flex flex-col", className)}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
        <div>
          <h3 className="text-section font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          {legend}
          {action}
        </div>
      </div>
      <div className="px-2 pb-3 pt-1 flex-1">{children}</div>
    </motion.div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
}

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
