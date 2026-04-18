# Wine Tracker App

## Mission

A personal single-user PWA to log, rate, and analyze wines using the WSET Level 3 Systematic Approach to Tasting (SAT). Primary goal: identify the best everyday wines under $20 by tracking structured tasting data and visualizing the price-vs-quality relationship over time.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Build | Vite 5 + React 18 |
| UI | shadcn/ui (Radix + Tailwind) |
| Forms | React Hook Form + Zod |
| Data fetching | TanStack Query v5 |
| Database | Supabase (Postgres 15) |
| File storage | Supabase Storage (bottle photos) |
| Offline queue | Dexie.js (IndexedDB write-ahead buffer) |
| PWA | vite-plugin-pwa + Workbox |
| Charts | Recharts |
| CSV export | papaparse |
| Hosting | Vercel or Netlify |

**Offline strategy:** Auto-save form steps to Dexie on every step transition. On submit with no connection, write to Dexie `sync_queue` (status: `pending`) and show "Saved locally" toast. Service Worker `sync` event flushes queue to Supabase when connectivity returns. `client_id` UUID prevents duplicate inserts on retry.

---

## Routes

```
/                   Dashboard
/wines              Wine list + filter panel
/wines/new          Multi-step tasting form (5 steps)
/wines/:id          Wine detail view
/wines/:id/edit     Edit tasting form
/explore            Scatterplot + Insights
/export             CSV export
```

---

## Key Design Decisions

- **Enum strings, not integers** for all ordinal fields (`'medium-plus'` not `3`). Sort order is encoded in app-layer `ORDINAL_SCALES` constants in `src/lib/ordinalScales.ts`.
- **Ordinal filter pattern:** Never use `>` on enum values. "Acidity ≥ medium-plus" becomes `WHERE palate_acidity IN ('medium-plus', 'high')` — IN clause, index-friendly.
- **Normalized `wine_aromas` join table** (not JSON arrays) for aroma/flavour tags. Enables efficient tag-based queries.
- **Generated columns:** `value_score = overall_rating / price_paid` and `deal_delta = retail_price - price_paid` — always consistent, no app-layer sync needed.
- **Same aroma tag vocabulary** for nose and palate; `context` column (`nose` | `palate`) distinguishes them.

---

## External Data Sources

- **LWIN Database (Liv-ex):** Free Creative Commons download. Seed into `wines_catalog` table for offline autocomplete on wine name, producer, appellation.
- **Wine-Searcher API:** 100 free calls/day for on-demand lookup of wines not in local catalog.
- **Kroger Product API:** Free official developer API for automated retail pricing (Tier 1).
- **Manual + deep-links:** Always-available fallback. "Check Price" button links to Vivino/Total Wine search URLs.

---

## Implementation Status

### Phase 1 — Foundation ✅
- [x] Initialize Vite 5 + React 18 + TypeScript project
- [x] Configure Tailwind CSS v4 + `@tailwindcss/vite`
- [x] `src/db/schema.sql` — all enums, tables, generated columns, indexes
- [x] `aroma_tags` seed (~75 WSET L3 tags) + `varietals` seed (43 varietals) in schema.sql
- [x] Configure `vite-plugin-pwa` + Workbox (asset caching + Supabase NetworkFirst)

### Phase 2 — Core Data Layer ✅
- [x] `src/lib/ordinalScales.ts` — all scale constants, types, `atLeast()` helper, color map
- [x] `src/lib/database.types.ts` — Wine, AromaTag, WineAroma, Varietal, WineInsert interfaces
- [x] `src/lib/supabase.ts` — Supabase client (env var guarded)
- [x] `src/lib/syncQueue.ts` — Dexie IndexedDB write-ahead queue + draft auto-save
- [x] `src/lib/hooks/useWines.ts` — all CRUD hooks + useAromaTags + useVarietals (TanStack Query)

### Phase 3 — Tasting Form (5-step wizard) ✅
- [x] `WineFormPage.tsx` — wizard shell, progress bar, Dexie draft persistence, offline queue fallback
- [x] `Step1_Identity.tsx` — name, producer, region, appellation, varietal chips, vintage, wine type, date, Vivino URL, cellar status
- [x] `Step2_Appearance.tsx` — clarity, intensity, color (wine-type filtered)
- [x] `Step3_Nose.tsx` — condition, intensity, development, AromaTagPicker (nose)
- [x] `Step4_Palate.tsx` — all palate fields, conditional tannin/mousse sections, AromaTagPicker (palate)
- [x] `Step5_Conclusions.tsx` — quality, readiness, star rating, price paid/retail, occasion notes
- [x] `AromaTagPicker.tsx` — primary/secondary/tertiary tabs, pill grid, custom tag input, selected chip list
- [x] `OrdinalSelector.tsx` — reusable segmented pill selector (≥44px tap targets)
- [x] `RatingPicker.tsx` — 1–5 star input (≥44px tap targets)

### Phase 4 — Wine List + Detail ✅
- [x] `WineListPage.tsx` — full-text search, sort controls (date/rating/price/value), FAB
- [x] `WineCard.tsx` — bottle photo or type-colored icon, meta, star rating, price badge, value score
- [x] `FilterPanel.tsx` — collapsible, wine type, rating, price max, acidity, sweetness, body, tannin, cellar status
- [x] `WineDetailPage.tsx` — full SAT display, aroma chips, value/deal metrics, Check Price deep-links

### Phase 5 — Explore + Insights ✅
- [x] `WineScatterplot.tsx` — Recharts scatter (x=price, y=rating, bubble size=value_score, color=wine_type), jitter, ≤$20 highlight
- [x] `InsightPanel.tsx` — price band bar chart, best value ≤$20, reliable producers (avg val/$, stddev), best deals, want-to-try list
- [x] `ExplorePage.tsx` — x-axis toggle (paid vs retail), ≤$20 toggle, filter panel wired
- [x] `DashboardPage.tsx` — stats bar (bottles/avg rating/avg price), best value card, top rated card, cellar summary, recent wines, empty state

### Phase 6 — Export + Polish ✅
- [x] `ExportPage.tsx` — 35-field checkbox selector, papaparse CSV download
- [x] `App.tsx` — BrowserRouter, all routes wired, QueryClient provider
- [x] `BottomNav.tsx` — Home / Wines / Explore / Export with active state
- [x] Production build verified (`npm run build` ✓, TypeScript clean)

### Remaining (not started)
- [ ] Set up Supabase project + run `schema.sql` against it
- [ ] Create `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] Kroger API pricing integration (optional)
- [ ] LWIN catalog import (optional)
- [ ] Mobile QA on iPhone Safari

---

## Verification Checklist

- [ ] Schema: all enums, generated columns, indexes create cleanly in Supabase
- [ ] Offline form: fill in airplane mode → submit → Dexie queue entry → reconnect → row appears in Supabase
- [ ] Ordinal filters: "acidity ≥ medium-plus AND body = full" → correct IN clause → scatterplot updates
- [ ] Value score: rating=4, price_paid=12 → `value_score = 0.3333` in DB (no app code)
- [ ] Scatterplot: 10+ wines → bubbles render with correct size, color, tooltip
- [ ] CSV export: all WSET fields, aroma tags (comma-separated), value score columns present
- [ ] Mobile: all 5 form steps on iPhone Safari, sticky nav doesn't cover inputs

---

## Critical Files

```
src/
├── db/schema.sql
├── lib/ordinalScales.ts
├── lib/syncQueue.ts
├── features/
│   ├── wine-form/         WineFormPage, Step1–5, AromaTagPicker
│   ├── wine-list/         WineListPage, WineCard, FilterPanel
│   ├── wine-detail/       WineDetailPage
│   ├── explore/           ExplorePage, WineScatterplot, InsightPanel
│   └── export/            ExportPage
└── components/
    ├── OrdinalSelector.tsx
    └── RatingPicker.tsx
```
