import { Badge } from "./Badge";
import { StatusDot } from "./StatusDot";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  tone: Tone;
  label: string;
  pulse?: boolean;
}

export function StatusBadge({ tone, label, pulse }: StatusBadgeProps) {
  return (
    <Badge tone={tone}>
      <StatusDot tone={tone} pulse={pulse} size={6} />
      <span>{label}</span>
    </Badge>
  );
}
