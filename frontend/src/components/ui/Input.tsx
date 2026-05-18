import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, label, hint, error, id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="label-eyebrow mb-1.5 block">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-2.5 inline-flex items-center text-zinc-400">
              {leftIcon}
            </span>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "block w-full h-9 rounded border bg-white dark:bg-zinc-900",
              "border-zinc-200 dark:border-zinc-800",
              "text-[13px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500",
              "px-3 py-1.5",
              "focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600",
              "transition-colors duration-micro",
              leftIcon && "pl-8",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className,
            )}
            {...rest}
          />
        </div>
        {hint && !error ? <p className="mt-1 text-[12px] text-zinc-500">{hint}</p> : null}
        {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = "Input";
