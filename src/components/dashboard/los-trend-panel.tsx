import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { losTimeSeries, type Filters, type TimeRangeKey } from "@/data/mock";
import { cn } from "@/lib/utils";

const SERIES_COLORS = [
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 55%)",
  "hsl(280 82% 65%)",
  "hsl(195 90% 55%)",
  "hsl(0 75% 60%)",
  "hsl(160 70% 50%)",
  "hsl(48 96% 55%)",
];

export function LosTrendPanel({ filters, timeRange }: { filters: Filters; timeRange: TimeRangeKey }) {
  const [groupBy, setGroupBy] = useState<"region" | "olt">("region");
  const { data, series } = useMemo(() => losTimeSeries(timeRange, groupBy, filters), [timeRange, groupBy, filters]);

  const fmtTime = (t: number) => {
    if (timeRange === "7d") return format(t, "MMM d");
    if (timeRange === "24h" || timeRange === "6h") return format(t, "HH:mm");
    return format(t, "HH:mm:ss");
  };

  return (
    <section className="panel fade-in p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">LOS Events Over Time</h2>
          <p className="text-[11px] text-muted-foreground">Users in Loss of Signal, grouped by {groupBy}</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-secondary p-0.5 text-[11px]">
          {(["region", "olt"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={cn(
                "rounded px-2.5 py-1 font-medium capitalize transition-colors",
                groupBy === g ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g === "olt" ? "OLT" : g}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={fmtTime}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              minTickGap={32}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "0 8px 24px hsl(0 0% 0% / 0.25)",
              }}
              labelFormatter={(t) => fmtTime(Number(t))}
              labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11, marginBottom: 4 }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stackId="1"
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={1.5}
                fill={`url(#grad-${i})`}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {series.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            <span className="font-medium text-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
