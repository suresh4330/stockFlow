import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, id, ...rest }, ref) => {
    const selectId = id || rest.name;
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={selectId} className="label-eyebrow mb-1.5 block">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "block w-full h-9 appearance-none rounded border bg-white dark:bg-zinc-900",
              "border-zinc-200 dark:border-zinc-800",
              "text-[13px] text-zinc-900 dark:text-zinc-100",
              "pl-3 pr-9 py-1.5",
              "focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600",
              className,
            )}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";
