import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TopProductsBarProps {
  data: { name: string; sku: string; stock: number }[];
}

export function TopProductsBar({ data }: TopProductsBarProps) {
  return (
    <div style={{ width: "100%", height: Math.max(160, data.length * 36) }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={140}
            tick={{ fontSize: 12, fill: "currentColor" }}
            className="text-zinc-600 dark:text-zinc-400"
          />
          <Tooltip
            cursor={{ fill: "currentColor", className: "text-zinc-100 dark:text-zinc-800/60", opacity: 0.4 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="surface rounded px-2 py-1.5 text-[12px]">
                  <p className="text-zinc-500">{label}</p>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100">{payload[0].value} in stock</p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="stock" radius={[0, 4, 4, 0]} animationDuration={600}>
            {data.map((_, i) => (
              <Cell key={i} fill="#059669" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
