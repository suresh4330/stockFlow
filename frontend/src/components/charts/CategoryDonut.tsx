import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryDonutProps {
  data: { name: string; value: number }[];
}

const COLORS = ["#059669", "#0d9488", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#047857", "#52525b"];

export function CategoryDonut({ data }: CategoryDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div style={{ width: 180, height: 180 }} className="relative shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={1}
              stroke="none"
              animationDuration={600}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="surface rounded px-2 py-1.5 text-[12px]">
                    <span className="text-zinc-500">{payload[0].name}: </span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">{payload[0].value}</span>
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-zinc-500">Total</span>
          <span className="text-[20px] font-medium font-mono text-zinc-900 dark:text-zinc-100">{total}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 max-h-[180px] overflow-y-auto">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2 w-2 rounded-sm shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-zinc-700 dark:text-zinc-300 truncate">{d.name}</span>
            <span className="ml-auto font-mono text-zinc-500">
              {d.value} · {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
