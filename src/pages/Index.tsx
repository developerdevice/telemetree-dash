import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopBar } from "@/components/dashboard/top-bar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LosTrendPanel } from "@/components/dashboard/los-trend-panel";
import { OltGrid } from "@/components/dashboard/olt-grid";
import { SlotPonHeatmap } from "@/components/dashboard/slot-pon-heatmap";
import { UserList } from "@/components/dashboard/user-list";
import { globalKpis, type Filters, type TimeRangeKey } from "@/data/mock";

const Index = () => {
  const [filters, setFilters] = useState<Filters>({ region: "all", oltId: "all", status: "all" });
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("1h");
  const [live, setLive] = useState(true);
  const [tab, setTab] = useState("overview");
  const [drill, setDrill] = useState<{ slot: number | "all"; pon: number | "all" }>({ slot: "all", pon: "all" });

  const kpis = useMemo(() => globalKpis(filters), [filters]);

  function handleHeatmapClick(oltId: string, slot: number, pon: number) {
    setFilters((f) => ({ ...f, oltId }));
    setDrill({ slot, pon });
    setTab("users");
  }

  function handleOltSelect(oltId: string) {
    setFilters((f) => ({ ...f, oltId }));
    setTab("heatmap");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        filters={filters}
        onFiltersChange={(f) => { setFilters(f); setDrill({ slot: "all", pon: "all" }); }}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        live={live}
        onLiveToggle={() => setLive((v) => !v)}
      />

      <main className="mx-auto max-w-[1480px] space-y-4 px-4 py-4 lg:px-6">
        {/* H1 for SEO, visually subtle */}
        <h1 className="sr-only">OLT Massives Monitoring Dashboard</h1>

        {/* KPI strip */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total OLTs"   value={kpis.oltCount} sparkKey="olt"   delta={0.0} tone="neutral" />
          <KpiCard label="Active PONs"  value={kpis.ponCount.toLocaleString()} sparkKey="pon"   delta={1.4} tone="good" />
          <KpiCard label="Users in LOS" value={kpis.losUsers.toLocaleString()} sparkKey="los"   delta={-3.2} tone="bad" />
          <KpiCard label="LOS rate"     value={kpis.losRate.toFixed(2)} unit="%" sparkKey="rate" delta={-0.6} tone="bad" />
        </section>

        {/* Trend */}
        <LosTrendPanel filters={filters} timeRange={timeRange} />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v !== "users") setDrill({ slot: "all", pon: "all" }); }}>
          <div className="flex items-center justify-between">
            <TabsList className="h-9 bg-secondary">
              <TabsTrigger value="overview" className="text-xs">By OLT</TabsTrigger>
              <TabsTrigger value="heatmap" className="text-xs">Slot × PON Heatmap</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">User List</TabsTrigger>
            </TabsList>
            {tab === "users" && (drill.slot !== "all" || drill.pon !== "all") && (
              <button
                onClick={() => setDrill({ slot: "all", pon: "all" })}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Drill: Slot {String(drill.slot)} / PON {String(drill.pon)} · clear
              </button>
            )}
          </div>

          <TabsContent value="overview" className="mt-4">
            <OltGrid filters={filters} onSelect={handleOltSelect} />
          </TabsContent>

          <TabsContent value="heatmap" className="mt-4">
            <SlotPonHeatmap filters={filters} onCellClick={handleHeatmapClick} />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UserList filters={filters} drillSlot={drill.slot} drillPon={drill.pon} />
          </TabsContent>
        </Tabs>

        <footer className="pt-6 pb-10 text-center text-[11px] text-muted-foreground">
          OLT Monitor · prototype with mock data · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
};

export default Index;
