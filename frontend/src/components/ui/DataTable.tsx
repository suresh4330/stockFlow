import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  width?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: ReactNode;
  loading?: boolean;
  loadingRows?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  loading,
  loadingRows = 6,
  onRowClick,
}: DataTableProps<T>) {
  const skeletonRows = Array.from({ length: loadingRows });

  return (
    <div className="surface rounded-card overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align ?? "left" }}
                className={cn(
                  "label-eyebrow px-4 py-2.5 font-medium text-zinc-500",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? skeletonRows.map((_, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="skeleton h-3.5 w-2/3" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length}>{empty}</td>
                </tr>
              )
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0",
                      "row-hover",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align ?? "left" }}
                        className={cn("px-4 py-3 text-zinc-700 dark:text-zinc-300", col.className)}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}
