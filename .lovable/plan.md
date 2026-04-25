## OLT Massives Dashboard — Plan

A clean, minimalist NOC dashboard for monitoring OLTs, PONs, slots, and users in LOS (Loss of Signal). Inspired by **Vercel** (typography, spacing, subtle borders) and **Grafana** (status colors, time-series panels, time picker).

---

### 🎨 Design direction

- **Theme:** Dark by default (NOC-friendly), light toggle in header.
  - Dark: near-black `#0a0a0a` bg, `#171717` panels, hairline borders, `#ededed` text.
  - Light: `#ffffff` bg, `#fafafa` panels, `#171717` text.
- **Accent:** Vercel blue `#3b82f6` for interactive elements.
- **Status palette (Grafana-style):**
  - 🟢 OK `#22c55e` · 🟡 Warning `#f59e0b` · 🔴 LOS/Critical `#ef4444` · ⚪ Unknown `#6b7280`
- **Typography:** Geist-style — Inter for UI, JetBrains Mono for metrics/IDs/dBm values.
- **Density:** Compact rows, tight spacing, generous whitespace between sections — feels like vercel.com/dashboard.
- **Motion:** Subtle — fade-ins, no bouncy animation. Skeleton loaders on data panels.

---

### 🧭 Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Logo  OLT Monitor      [Region ▾][OLT ▾][Status ▾][⏱ 1h ▾]🌗│  ← top bar
├──────────────────────────────────────────────────────────────┤
│ ▸ Total OLTs   ▸ Active PONs   ▸ Users LOS   ▸ LOS Rate %   │  ← KPI strip
├──────────────────────────────────────────────────────────────┤
│ ┌─ LOS Trend (time series) ─────────────────────────────┐    │
│ │ Grafana-style area chart, last [time range]           │    │
│ └───────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│ Tabs: [ By OLT ] [ Slot × PON Heatmap ] [ User List ]        │
│                                                              │
│ (active tab content)                                         │
└──────────────────────────────────────────────────────────────┘
```

Single-page dashboard (no sidebar needed — keeps it minimalist). Header contains all global filters.

---

### 🧱 Components & views

**1. Top bar**
- Brand mark + "OLT Monitor"
- Global filters: Region, OLT, Status (OK/Warning/LOS/All), Time range (15m / 1h / 6h / 24h / 7d / custom)
- Theme toggle (🌗) + refresh + "Live" indicator (pulsing dot when auto-refresh on)

**2. KPI cards (4 across)**
- Total OLTs · Active PONs · Users in LOS · LOS Rate %
- Each: big number, tiny sparkline, delta vs previous period, color-coded.

**3. LOS Trend panel (Grafana-style)**
- Stacked area chart of LOS events over the selected time range.
- Series: by Region or by OLT (toggle).
- Hover tooltip with timestamp + per-series values, crosshair, zoom-to-select.

**4. Tab: By OLT (overview grid)**
- Card grid of OLTs. Each card shows:
  - OLT name + region · health pill (OK/Warn/Crit)
  - PON count · users-in-LOS count · uptime
  - Mini bar showing slot occupancy
- Click → opens drawer with that OLT's slot/PON detail.

**5. Tab: Slot × PON Heatmap**
- Matrix: rows = Slots, columns = PONs, cells colored by # users in LOS (green→amber→red gradient).
- Toggle: "Group by Slot" / "Group by PON" / "Ungrouped (flat)".
- Hover cell → tooltip with counts; click → opens user list filtered to that slot/PON.

**6. Tab: User List**
- Dense, sortable table of ONUs/users currently affected.
- Columns: ONU ID · OLT · Slot · PON · Status · Last seen · (placeholder columns you can rename later)
- Filters: status chips, search by ID, slot/PON multi-select.
- Row click → side drawer with full detail + mini history chart.

---

### 🔧 Filters & interactions

- **Cross-filtering:** selecting an OLT in the header filters the heatmap and user list. Clicking a heatmap cell deep-links to the User List tab pre-filtered.
- **Time range:** affects trend chart + delta calcs in KPI cards.
- **URL state:** filters persist in the query string so dashboards are shareable.
- **Auto-refresh:** dropdown (Off / 10s / 30s / 1m) with the "Live" indicator.

---

### 🗂 Data (mock)

A single `src/data/mock.ts` module generates:
- ~8 OLTs across 3 regions
- 4–16 slots per OLT, 8 PONs per slot
- Realistic user counts per PON, randomized LOS events with timestamps over the last 7 days
- Helper selectors: `getOLTs()`, `getSlotPonMatrix(oltId)`, `getLosUsers(filters)`, `getLosTimeSeries(range, groupBy)`
- Easy to swap for a real API later — all components read from typed selectors, not raw data.

---

### 📦 Tech notes

- Routes: single `/` dashboard route (tabs handle the views — no extra pages needed).
- Charts: `recharts` (already common in shadcn stack) for trend + sparklines.
- Theme: extend `index.css` HSL tokens with status colors; add `next-themes`-style toggle using `class="dark"` on `<html>`.
- All colors via design tokens — no hardcoded hex in components.

---

### ✅ Deliverables

1. Dark/light theme tokens + toggle
2. Top bar with all global filters + URL sync
3. KPI strip (4 cards w/ sparklines + deltas)
4. LOS time-series panel
5. Three tabs: By OLT grid · Slot×PON heatmap · User list
6. Drill-down drawers (OLT detail, user detail)
7. Mock data module with typed selectors

Once you approve, I'll build it end-to-end. After it's running, you can tweak user-list columns, swap mock data for your API, and adjust accent colors to taste.