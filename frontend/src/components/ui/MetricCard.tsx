import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/cn";

interface MetricCardProps {
  label: string;
  value: number | string;
  format?: (n: number) => string;
  trend?: { value: number; direction: "up" | "down" | "flat"; label?: string };
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  index?: number;
  trendTone?: "auto" | "positive" | "negative" | "neutral";
}

export function MetricCard({
  label,
  value,
  format,
  trend,
  prefix,
  suffix,
  loading,
  index = 0,
  trendTone = "auto",
}: MetricCardProps) {
  const numericValue = typeof value === "number" ? value : 0;
  const animated = useCountUp(numericValue, 600);
  const displayValue =
    typeof value === "string"
      ? value
      : format
        ? format(animated)
        : Math.round(animated).toLocaleString("en-US");

  let trendColor = "text-zinc-500";
  if (trend) {
    if (trendTone === "auto") {
      trendColor =
        trend.direction === "up"
          ? "text-emerald-600 dark:text-emerald-400"
          : trend.direction === "down"
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-500";
    } else if (trendTone === "positive") {
      trendColor = "text-emerald-600 dark:text-emerald-400";
    } else if (trendTone === "negative") {
      trendColor = "text-red-600 dark:text-red-400";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn("surface rounded-card p-4 flex flex-col gap-2")}
    >
      <p className="label-eyebrow">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          {prefix ? <span className="text-zinc-400 text-[14px] font-mono">{prefix}</span> : null}
          <span className="text-metric font-medium font-mono text-zinc-900 dark:text-zinc-100">
            {displayValue}
          </span>
          {suffix ? <span className="text-zinc-400 text-[13px]">{suffix}</span> : null}
        </div>
      )}
      {trend && !loading ? (
        <div className={cn("flex items-center gap-1 text-[12px]", trendColor)}>
          {trend.direction === "up" ? (
            <ArrowUpRight size={12} />
          ) : trend.direction === "down" ? (
            <ArrowDownRight size={12} />
          ) : null}
          <span className="font-medium">
            {trend.value > 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          {trend.label ? <span className="text-zinc-400 dark:text-zinc-500">· {trend.label}</span> : null}
        </div>
      ) : null}
    </motion.div>
  );
}
