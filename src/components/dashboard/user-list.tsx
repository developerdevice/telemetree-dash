import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { OLTS, filterUsers, type Filters, type OnuUser } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  filters: Filters;
  drillSlot?: number | "all";
  drillPon?: number | "all";
}

type SortKey = keyof Pick<OnuUser, "id" | "customer" | "slot" | "pon" | "status" | "rxPower" | "lastSeen">;

export function UserList({ filters, drillSlot = "all", drillPon = "all" }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showOk, setShowOk] = useState(false);

  const users = useMemo(() => {
    const all = filterUsers({ ...filters, slot: drillSlot, pon: drillPon, query });
    const filtered = showOk ? all : all.filter((u) => u.status !== "ok");
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted.slice(0, 500);
  }, [filters, drillSlot, drillPon, query, sortKey, sortDir, showOk]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  const oltName = (id: string) => OLTS.find((o) => o.id === id)?.name ?? id;

  return (
    <section className="panel fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">ONU / Users</h2>
          <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {users.length.toLocaleString()}{users.length === 500 ? "+" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
            <input type="checkbox" checked={showOk} onChange={(e) => setShowOk(e.target.checked)} className="h-3.5 w-3.5 rounded border-border" />
            Show OK
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, serial…"
              className="h-8 w-64 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[640px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-panel">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <Th onClick={() => toggleSort("status")} active={sortKey === "status"}>Status</Th>
              <Th onClick={() => toggleSort("id")} active={sortKey === "id"}>ONU ID</Th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">OLT</th>
              <Th onClick={() => toggleSort("slot")} active={sortKey === "slot"}>Slot</Th>
              <Th onClick={() => toggleSort("pon")} active={sortKey === "pon"}>PON</Th>
              <Th onClick={() => toggleSort("rxPower")} active={sortKey === "rxPower"}>Rx (dBm)</Th>
              <Th onClick={() => toggleSort("lastSeen")} active={sortKey === "lastSeen"}>Last seen</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border/60 transition-colors hover:bg-accent/40"
              >
                <td className="px-3 py-2"><StatusPill status={u.status} /></td>
                <td className="px-3 py-2 font-mono text-[11px]">{u.id}</td>
                <td className="px-3 py-2">{u.customer}</td>
                <td className="px-3 py-2 text-muted-foreground">{oltName(u.oltId)}</td>
                <td className="px-3 py-2 font-mono">{u.slot}</td>
                <td className="px-3 py-2 font-mono">{u.pon}</td>
                <td className={cn("px-3 py-2 font-mono",
                  u.rxPower < -27 ? "text-status-crit" : u.rxPower < -25 ? "text-status-warn" : "text-foreground",
                )}>{u.rxPower.toFixed(1)}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{format(u.lastSeen, "HH:mm:ss")}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted-foreground">No users match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <th className="px-3 py-2">
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 font-medium uppercase tracking-wider", active && "text-foreground")}>
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </th>
  );
}
