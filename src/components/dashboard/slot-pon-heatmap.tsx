import { useMemo, useState } from "react";
import { OLTS, filterPons, type Filters } from "@/data/mock";
import { cn } from "@/lib/utils";

interface Props {
  filters: Filters;
  onCellClick: (oltId: string, slot: number, pon: number) => void;
}

type GroupMode = "slot" | "pon" | "flat";

function heatColor(losPct: number): string {
  if (losPct === 0) return "hsl(var(--heat-0) / 0.18)";
  if (losPct < 2) return "hsl(var(--heat-1) / 0.55)";
  if (losPct < 8) return "hsl(var(--heat-2) / 0.7)";
  if (losPct < 20) return "hsl(var(--heat-3) / 0.85)";
  return "hsl(var(--heat-4))";
}

function textOn(losPct: number): string {
  return losPct > 8 ? "text-background" : "text-foreground";
}

export function SlotPonHeatmap({ filters, onCellClick }: Props) {
  const [group, setGroup] = useState<GroupMode>("slot");

  const pons = useMemo(() => filterPons(filters), [filters]);

  // Determine OLTs in scope. If multiple OLTs, render one matrix per OLT.
  const oltsInScope = useMemo(() => {
    const ids = Array.from(new Set(pons.map((p) => p.oltId)));
    return OLTS.filter((o) => ids.includes(o.id));
  }, [pons]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Slot × PON Heatmap</h2>
          <p className="text-[11px] text-muted-foreground">Cell color = % users in LOS for that PON. Click to drill into users.</p>
        </div>
        <div className="flex items-center gap-3">
          <Legend />
          <div className="inline-flex rounded-md border border-border bg-secondary p-0.5 text-[11px]">
            {([
              { k: "slot", label: "Group by Slot" },
              { k: "pon", label: "Group by PON" },
              { k: "flat", label: "Ungrouped" },
            ] as const).map((g) => (
              <button
                key={g.k}
                onClick={() => setGroup(g.k)}
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition-colors",
                  group === g.k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {oltsInScope.map((olt) => {
          const oltPons = pons.filter((p) => p.oltId === olt.id);
          const slots = Array.from(new Set(oltPons.map((p) => p.slot))).sort((a, b) => a - b);
          const ponNums = Array.from(new Set(oltPons.map((p) => p.pon))).sort((a, b) => a - b);

          return (
            <section key={olt.id} className="panel fade-in p-4">
              <header className="mb-3 flex items-baseline justify-between">
                <h3 className="text-xs font-semibold tracking-tight">
                  {olt.name} <span className="text-muted-foreground font-normal">· {olt.region} · {olt.model}</span>
                </h3>
                <span className="font-mono text-[11px] text-muted-foreground">{slots.length} slots × {ponNums.length} PONs</span>
              </header>

              {group === "flat" ? (
                <div className="flex flex-wrap gap-1">
                  {oltPons.map((p) => {
                    const pct = (p.losUsers / Math.max(1, p.totalUsers)) * 100;
                    return (
                      <Cell
                        key={`${p.slot}-${p.pon}`}
                        label={`S${p.slot}/P${p.pon}`}
                        sub={`${p.losUsers}/${p.totalUsers}`}
                        pct={pct}
                        onClick={() => onCellClick(olt.id, p.slot, p.pon)}
                      />
                    );
                  })}
                </div>
              ) : (
                <Matrix
                  rows={group === "slot" ? slots : ponNums}
                  cols={group === "slot" ? ponNums : slots}
                  rowLabel={group === "slot" ? "Slot" : "PON"}
                  colLabel={group === "slot" ? "PON" : "Slot"}
                  getCell={(row, col) => {
                    const slot = group === "slot" ? row : col;
                    const pon = group === "slot" ? col : row;
                    return oltPons.find((p) => p.slot === slot && p.pon === pon);
                  }}
                  onClick={(row, col) => {
                    const slot = group === "slot" ? row : col;
                    const pon = group === "slot" ? col : row;
                    onCellClick(olt.id, slot, pon);
                  }}
                />
              )}
            </section>
          );
        })}
        {oltsInScope.length === 0 && (
          <div className="panel p-10 text-center text-sm text-muted-foreground">No data for the current filters.</div>
        )}
      </div>
    </div>
  );
}

function Matrix({
  rows, cols, rowLabel, colLabel, getCell, onClick,
}: {
  rows: number[]; cols: number[];
  rowLabel: string; colLabel: string;
  getCell: (row: number, col: number) => { losUsers: number; totalUsers: number } | undefined;
  onClick: (row: number, col: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10 text-right pr-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {rowLabel}\{colLabel}
            </th>
            {cols.map((c) => (
              <th key={c} className="w-9 text-center text-[10px] font-mono font-medium text-muted-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="pr-2 text-right font-mono text-[10px] text-muted-foreground">{r}</td>
              {cols.map((c) => {
                const cell = getCell(r, c);
                if (!cell) return <td key={c} className="h-9 w-9" />;
                const pct = (cell.losUsers / Math.max(1, cell.totalUsers)) * 100;
                return (
                  <td key={c} className="p-0">
                    <button
                      onClick={() => onClick(r, c)}
                      title={`${rowLabel} ${r} / ${colLabel} ${c} — ${cell.losUsers}/${cell.totalUsers} LOS (${pct.toFixed(1)}%)`}
                      className={cn(
                        "h-9 w-9 rounded-sm font-mono text-[10px] font-medium transition-transform hover:scale-110 hover:ring-1 hover:ring-foreground/40",
                        textOn(pct),
                      )}
                      style={{ background: heatColor(pct) }}
                    >
                      {cell.losUsers > 0 ? cell.losUsers : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ label, sub, pct, onClick }: { label: string; sub: string; pct: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${label} — ${sub} (${pct.toFixed(1)}%)`}
      className={cn(
        "flex h-12 w-16 flex-col items-center justify-center rounded-sm text-[10px] transition-transform hover:scale-105 hover:ring-1 hover:ring-foreground/40",
        textOn(pct),
      )}
      style={{ background: heatColor(pct) }}
    >
      <span className="font-mono font-semibold">{label}</span>
      <span className="font-mono opacity-80">{sub}</span>
    </button>
  );
}

function Legend() {
  const stops = [
    { label: "0%", c: "hsl(var(--heat-0) / 0.18)" },
    { label: "<2%", c: "hsl(var(--heat-1) / 0.55)" },
    { label: "<8%", c: "hsl(var(--heat-2) / 0.7)" },
    { label: "<20%", c: "hsl(var(--heat-3) / 0.85)" },
    { label: "≥20%", c: "hsl(var(--heat-4))" },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {stops.map((s) => (
        <div key={s.label} className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm" style={{ background: s.c }} />
          <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
