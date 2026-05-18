import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...rest }, ref) => {
    return (
      <span
        className={cn(
          "relative inline-flex h-4 w-4 items-center justify-center rounded-[4px] border",
          "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900",
          "transition-colors duration-micro",
          checked && "bg-emerald-600 border-emerald-600",
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="absolute inset-0 cursor-pointer opacity-0"
          {...rest}
        />
        {checked ? <Check size={11} className="text-white" strokeWidth={3} /> : null}
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";
