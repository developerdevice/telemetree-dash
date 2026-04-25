import { ArrowDown, ArrowUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { sparklineFor } from "@/data/mock";

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number; // percent
  tone?: "neutral" | "good" | "bad";
  sparkKey: string;
}

export function KpiCard({ label, value, unit, delta, tone = "neutral", sparkKey }: KpiCardProps) {
  const data = sparklineFor(sparkKey);
  const positive = (delta ?? 0) >= 0;
  const goodWhenDown = tone === "bad"; // for LOS: down is good
  const isGood = goodWhenDown ? !positive : positive;

  const sparkColor =
    tone === "bad" ? "hsl(var(--status-crit))" :
    tone === "good" ? "hsl(var(--status-ok))" :
    "hsl(var(--primary))";

  return (
    <div className="panel fade-in relative overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          {delta !== undefined && (
            <div className={cn("inline-flex items-center gap-1 text-[11px] font-medium",
              isGood ? "text-status-ok" : "text-status-crit",
            )}>
              {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
              <span className="text-muted-foreground font-normal">vs prev</span>
            </div>
          )}
        </div>
        <div className="h-12 w-24 opacity-90">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${sparkKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#spark-${sparkKey})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
