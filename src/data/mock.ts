// Mock data generator for OLT / Slot / PON / ONU LOS dashboard.
// Deterministic via seeded RNG so reloads are stable.

export type Region = "São Paulo" | "Rio" | "Recife";
export type Status = "ok" | "warn" | "crit";

export interface Olt {
  id: string;
  name: string;
  region: Region;
  vendor: string;
  model: string;
  uptimeDays: number;
  slotCount: number;
  ponPerSlot: number;
}

export interface Pon {
  oltId: string;
  slot: number;
  pon: number;
  totalUsers: number;
  losUsers: number;
}

export interface OnuUser {
  id: string;
  serial: string;
  customer: string;
  oltId: string;
  slot: number;
  pon: number;
  status: Status;
  rxPower: number; // dBm
  lastSeen: number; // ms epoch
  uptime: string;
}

export interface TimePoint {
  t: number; // epoch ms
  [key: string]: number;
}

// ---------- seeded RNG ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260425);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// ---------- OLTs ----------
const VENDORS = [
  { vendor: "Huawei", model: "MA5800-X17" },
  { vendor: "ZTE", model: "C320" },
  { vendor: "Nokia", model: "FX-16" },
  { vendor: "Fiberhome", model: "AN6000-17" },
];
const REGIONS: Region[] = ["São Paulo", "Rio", "Recife"];

export const OLTS: Olt[] = range(8).map((i) => {
  const v = VENDORS[i % VENDORS.length];
  return {
    id: `olt-${String(i + 1).padStart(2, "0")}`,
    name: `OLT-${pick(["CTR", "NRT", "SUL", "LST", "OST", "ZNO", "ZNS", "BAR"])}-${String(i + 1).padStart(2, "0")}`,
    region: REGIONS[i % REGIONS.length],
    vendor: v.vendor,
    model: v.model,
    uptimeDays: Math.floor(rand() * 540) + 12,
    slotCount: [8, 12, 16, 16, 8, 12, 16, 14][i],
    ponPerSlot: 8,
  };
});

// ---------- PONs ----------
export const PONS: Pon[] = OLTS.flatMap((olt) =>
  range(olt.slotCount).flatMap((slot) =>
    range(olt.ponPerSlot).map((pon) => {
      const total = 32 + Math.floor(rand() * 96); // 32–128 ONUs
      // Most PONs healthy; ~12% have some LOS, ~3% bad
      const r = rand();
      let los = 0;
      if (r > 0.97) los = Math.floor(total * (0.4 + rand() * 0.5));
      else if (r > 0.88) los = Math.floor(total * (0.05 + rand() * 0.2));
      else if (r > 0.7) los = Math.floor(rand() * 3);
      return { oltId: olt.id, slot: slot + 1, pon: pon + 1, totalUsers: total, losUsers: los };
    }),
  ),
);

// ---------- ONU users in LOS ----------
const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Felipe", "Gabi", "Heitor", "Iris", "João", "Karina", "Lucas", "Marina", "Nuno", "Olivia", "Pedro", "Rafa", "Sofia", "Thiago", "Vitor"];
const LAST = ["Silva", "Souza", "Costa", "Lima", "Pereira", "Almeida", "Rocha", "Carvalho", "Ribeiro", "Gomes", "Martins", "Araújo", "Barbosa", "Cardoso", "Dias"];

export const USERS: OnuUser[] = PONS.flatMap((p) => {
  const olt = OLTS.find((o) => o.id === p.oltId)!;
  return range(p.totalUsers).map((u) => {
    const inLos = u < p.losUsers;
    const r = rand();
    const status: Status = inLos ? (r > 0.7 ? "crit" : "warn") : "ok";
    const rx = inLos ? -28 - rand() * 6 : -18 - rand() * 6;
    return {
      id: `${p.oltId}-S${p.slot}-P${p.pon}-O${u + 1}`,
      serial: `HWTC${Math.floor(rand() * 0xffffffff).toString(16).toUpperCase().padStart(8, "0")}`,
      customer: `${pick(FIRST)} ${pick(LAST)}`,
      oltId: olt.id,
      slot: p.slot,
      pon: p.pon,
      status,
      rxPower: Math.round(rx * 10) / 10,
      lastSeen: Date.now() - Math.floor(rand() * 1000 * 60 * 60 * 6),
      uptime: inLos ? "—" : `${Math.floor(rand() * 90) + 1}d`,
    };
  });
});

// ---------- Selectors / aggregates ----------
export type Filters = {
  region?: Region | "all";
  oltId?: string | "all";
  status?: Status | "all";
};

export function filterPons(filters: Filters): Pon[] {
  return PONS.filter((p) => {
    if (filters.oltId && filters.oltId !== "all" && p.oltId !== filters.oltId) return false;
    if (filters.region && filters.region !== "all") {
      const olt = OLTS.find((o) => o.id === p.oltId);
      if (olt?.region !== filters.region) return false;
    }
    return true;
  });
}

export function oltStatus(oltId: string): Status {
  const pons = PONS.filter((p) => p.oltId === oltId);
  const losTotal = pons.reduce((s, p) => s + p.losUsers, 0);
  const total = pons.reduce((s, p) => s + p.totalUsers, 0);
  const rate = losTotal / Math.max(1, total);
  if (rate > 0.08) return "crit";
  if (rate > 0.02) return "warn";
  return "ok";
}

export function oltSummary(oltId: string) {
  const pons = PONS.filter((p) => p.oltId === oltId);
  const totalUsers = pons.reduce((s, p) => s + p.totalUsers, 0);
  const losUsers = pons.reduce((s, p) => s + p.losUsers, 0);
  const ponsWithLos = pons.filter((p) => p.losUsers > 0).length;
  return { ponCount: pons.length, totalUsers, losUsers, ponsWithLos, status: oltStatus(oltId) };
}

export function filterUsers(filters: Filters & { slot?: number | "all"; pon?: number | "all"; query?: string }): OnuUser[] {
  return USERS.filter((u) => {
    if (filters.oltId && filters.oltId !== "all" && u.oltId !== filters.oltId) return false;
    if (filters.region && filters.region !== "all") {
      const olt = OLTS.find((o) => o.id === u.oltId);
      if (olt?.region !== filters.region) return false;
    }
    if (filters.status && filters.status !== "all" && u.status !== filters.status) return false;
    if (filters.slot && filters.slot !== "all" && u.slot !== filters.slot) return false;
    if (filters.pon && filters.pon !== "all" && u.pon !== filters.pon) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (!u.id.toLowerCase().includes(q) && !u.customer.toLowerCase().includes(q) && !u.serial.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

// ---------- Time series ----------
export type TimeRangeKey = "15m" | "1h" | "6h" | "24h" | "7d";
export const TIME_RANGES: { key: TimeRangeKey; label: string; ms: number; points: number }[] = [
  { key: "15m", label: "Last 15 min", ms: 15 * 60_000, points: 30 },
  { key: "1h",  label: "Last 1 hour",  ms: 60 * 60_000, points: 60 },
  { key: "6h",  label: "Last 6 hours", ms: 6 * 3600_000, points: 72 },
  { key: "24h", label: "Last 24 hours", ms: 24 * 3600_000, points: 96 },
  { key: "7d",  label: "Last 7 days",   ms: 7 * 24 * 3600_000, points: 84 },
];

export function losTimeSeries(rangeKey: TimeRangeKey, groupBy: "region" | "olt", filters: Filters): {
  data: TimePoint[];
  series: { key: string; label: string }[];
} {
  const range_ = TIME_RANGES.find((r) => r.key === rangeKey)!;
  const now = Date.now();
  const step = range_.ms / range_.points;
  const seriesKeys = groupBy === "region"
    ? REGIONS
    : OLTS
        .filter((o) => !filters.oltId || filters.oltId === "all" || o.id === filters.oltId)
        .filter((o) => !filters.region || filters.region === "all" || o.region === filters.region)
        .map((o) => o.name);

  // Baseline LOS per series (current snapshot)
  const baseline: Record<string, number> = {};
  if (groupBy === "region") {
    for (const r of REGIONS) {
      baseline[r] = OLTS.filter((o) => o.region === r).reduce(
        (s, o) => s + PONS.filter((p) => p.oltId === o.id).reduce((ss, p) => ss + p.losUsers, 0),
        0,
      );
    }
  } else {
    for (const o of OLTS) {
      baseline[o.name] = PONS.filter((p) => p.oltId === o.id).reduce((ss, p) => ss + p.losUsers, 0);
    }
  }

  const data: TimePoint[] = [];
  // Use a fresh seeded RNG per call so chart re-renders are stable per range
  const r2 = mulberry32(rangeKey.charCodeAt(0) * 7 + groupBy.length);
  for (let i = 0; i < range_.points; i++) {
    const t = now - range_.ms + i * step;
    const point: TimePoint = { t };
    for (const key of seriesKeys as string[]) {
      const b = baseline[key] ?? 10;
      // wave + noise, ramp toward "current" value at the right edge
      const ramp = i / range_.points;
      const wave = Math.sin(i / 6 + key.length) * b * 0.25;
      const noise = (r2() - 0.5) * b * 0.3;
      point[key] = Math.max(0, Math.round(b * (0.55 + 0.45 * ramp) + wave + noise));
    }
    data.push(point);
  }
  return { data, series: (seriesKeys as string[]).map((k) => ({ key: k, label: k })) };
}

// Sparkline helper for KPI cards
export function sparklineFor(key: string, len = 24): { v: number }[] {
  const r = mulberry32(key.split("").reduce((s, c) => s + c.charCodeAt(0), 0));
  const base = 10 + r() * 40;
  return range(len).map((i) => ({ v: Math.max(0, Math.round(base + Math.sin(i / 3) * base * 0.3 + (r() - 0.5) * base * 0.4)) }));
}

export function globalKpis(filters: Filters) {
  const pons = filterPons(filters);
  const oltIds = new Set(pons.map((p) => p.oltId));
  const totalUsers = pons.reduce((s, p) => s + p.totalUsers, 0);
  const losUsers = pons.reduce((s, p) => s + p.losUsers, 0);
  return {
    oltCount: oltIds.size,
    ponCount: pons.length,
    losUsers,
    losRate: totalUsers ? (losUsers / totalUsers) * 100 : 0,
  };
}
