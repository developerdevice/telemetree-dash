import { ChevronRight, Server } from "lucide-react";
import { OLTS, oltSummary, type Filters } from "@/data/mock";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";

interface Props {
  filters: Filters;
  onSelect: (oltId: string) => void;
}

export function OltGrid({ filters, onSelect }: Props) {
  const olts = OLTS
    .filter((o) => !filters.region || filters.region === "all" || o.region === filters.region)
    .filter((o) => !filters.oltId || filters.oltId === "all" || o.id === filters.oltId);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {olts.map((olt) => {
        const s = oltSummary(olt.id);
        const losPct = s.totalUsers ? (s.losUsers / s.totalUsers) * 100 : 0;
        return (
          <button
            key={olt.id}
            onClick={() => onSelect(olt.id)}
            className="panel fade-in group relative flex flex-col gap-3 p-4 text-left transition-all hover:border-foreground/20 hover:bg-accent/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-foreground">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">{olt.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{olt.region} · {olt.vendor}</p>
                </div>
              </div>
              <StatusPill status={s.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
              <Stat label="PONs" value={s.ponCount} />
              <Stat label="Users" value={s.totalUsers.toLocaleString()} />
              <Stat label="LOS" value={s.losUsers.toLocaleString()} accent={s.losUsers > 0} />
            </div>

            {/* slot occupancy bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>LOS rate</span>
                <span className="font-mono">{losPct.toFixed(2)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all",
                    s.status === "ok" && "bg-status-ok",
                    s.status === "warn" && "bg-status-warn",
                    s.status === "crit" && "bg-status-crit",
                  )}
                  style={{ width: `${Math.min(100, Math.max(2, losPct * 6))}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                <span>Uptime <span className="font-mono text-foreground">{olt.uptimeDays}d</span></span>
                <span className="inline-flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </button>
        );
      })}
      {olts.length === 0 && (
        <div className="col-span-full panel p-10 text-center text-sm text-muted-foreground">
          No OLTs match the current filters.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-mono text-sm font-semibold", accent && "text-status-crit")}>{value}</p>
    </div>
  );
}
