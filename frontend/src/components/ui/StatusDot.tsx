import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-zinc-400",
};

interface StatusDotProps {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
  size?: number;
}

export function StatusDot({ tone = "success", pulse = false, className, size = 8 }: StatusDotProps) {
  return (
    <span className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <span
        className={cn("absolute inset-0 rounded-full", tones[tone])}
        style={{ width: size, height: size }}
      />
      {pulse ? (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-status-pulse opacity-70",
            tones[tone],
          )}
          style={{ width: size, height: size }}
        />
      ) : null}
    </span>
  );
}
