import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/40 disabled:text-white/80",
  secondary:
    "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
  ghost:
    "bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, leftIcon, rightIcon, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded font-medium",
          "transition-colors duration-micro ease-out-expo",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {leftIcon ? <span className="-ml-0.5 inline-flex">{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span className="-mr-0.5 inline-flex">{rightIcon}</span> : null}
      </button>
    );
  },
);
Button.displayName = "Button";
