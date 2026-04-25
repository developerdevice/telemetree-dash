import { Activity, RefreshCw } from "lucide-react";
import { OLTS, type Filters, type TimeRangeKey, TIME_RANGES, type Region } from "@/data/mock";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  timeRange: TimeRangeKey;
  onTimeRangeChange: (t: TimeRangeKey) => void;
  live: boolean;
  onLiveToggle: () => void;
}

const REGIONS: Region[] = ["São Paulo", "Rio", "Recife"];

export function TopBar({ filters, onFiltersChange, timeRange, onTimeRangeChange, live, onLiveToggle }: Props) {
  const oltsForRegion = OLTS.filter((o) => !filters.region || filters.region === "all" || o.region === filters.region);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
            <Activity className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight">OLT Monitor</span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">/ massives</span>
          </div>
        </div>

        <div className="hidden h-5 w-px bg-border md:block" />

        {/* Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select
            value={filters.region ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, region: v as Region | "all", oltId: "all" })}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={filters.oltId ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, oltId: v })}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="OLT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OLTs</SelectItem>
              {oltsForRegion.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, status: v as Filters["status"] })}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="crit">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRangeKey)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Live + theme */}
        <div className="flex items-center gap-1">
          <button
            onClick={onLiveToggle}
            className="group flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-pressed={live}
          >
            <span className="relative inline-flex h-2 w-2">
              {live && <span className="live-dot absolute inset-0" />}
              <span className={`h-2 w-2 rounded-full ${live ? "bg-status-ok" : "bg-muted-foreground/40"}`} />
            </span>
            <span className="font-medium">{live ? "Live" : "Paused"}</span>
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
