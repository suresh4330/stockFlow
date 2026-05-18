import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { formatShortDate } from "@/lib/format";

interface StockMovementChartProps {
  data: { date: string; stock_in: number; stock_out: number }[];
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface rounded px-2.5 py-2 shadow-none text-[12px]">
      <p className="text-zinc-500 mb-1">{label ? formatShortDate(String(label)) : ""}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 font-mono">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-zinc-500 capitalize">
            {String(p.dataKey).replace("_", " ")}
          </span>
          <span className="text-zinc-900 dark:text-zinc-100 ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StockMovementChart({ data }: StockMovementChartProps) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-zinc-400"
            tickFormatter={(v) => formatShortDate(String(v))}
            minTickGap={32}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-zinc-400"
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "currentColor", className: "text-zinc-300 dark:text-zinc-700" }} />
          <Line
            type="monotone"
            dataKey="stock_in"
            stroke="#059669"
            strokeWidth={1.75}
            dot={false}
            animationDuration={600}
          />
          <Line
            type="monotone"
            dataKey="stock_out"
            stroke="#f97316"
            strokeWidth={1.75}
            dot={false}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
