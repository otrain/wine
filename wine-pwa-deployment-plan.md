# Wine Tracker — Vercel Deployment + PWA/Offline Implementation Plan

> Generated: 2026-04-18  
> Based on codebase audit of `C:\Users\owenp\claude code\wine`

---

## Codebase Snapshot (what's already done vs what needs doing)

**Already installed in package.json — no npm installs needed:**
- `dexie` ^4.4.2 ✅
- `vite-plugin-pwa` ^1.2.0 ✅
- `workbox-window` ^7.4.0 ✅

**Already configured:**
- `VitePWA` plugin wired into `vite.config.ts` with `autoUpdate`, basic manifest, and Supabase `NetworkFirst` runtime cache
- `syncQueue.ts` — Dexie `WineDB` class with `sync_queue` + `drafts` tables, `enqueueWine`, `saveDraft`, `loadDraft`, `clearDraft`, `getPendingQueue`, `markSynced`, `markFailed`
- Live Supabase credentials in `.env` (URL: `rnsjdrpsimbtbdxuvrof.supabase.co`)
- PWA icons: `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` already in `public/`
- Build has been run — `dist/` exists with `sw.js`, `manifest.webmanifest`, `workbox-b51dd497.js`

**Gaps that need to close:**
- No `vercel.json` (SPA rewrite rule missing — all sub-routes return 404 on hard reload)
- `index.html` has no iOS PWA meta tags or apple-touch-icon link
- No `masked-icon.svg` in `public/` (referenced in `vite.config.ts` `includeAssets` but missing)
- Manifest only has two icon sizes — missing `purpose: 'maskable'` entry and 180×180 iOS size
- No flush logic for offline queue (no `visibilitychange` handler, no reconnect toast)
- No UI-layer offline indicator
- No `.env.example` committed to repo (security hygiene)

---

## Phase 1 — Vercel Deployment

### 1.1 Environment Variables

**[MANUAL] — Vercel Dashboard → Project Settings → Environment Variables**

Set these for **Production** AND **Preview** environments:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://rnsjdrpsimbtbdxuvrof.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(your anon key from `.env`)* |

Why they must be set in the dashboard: Vite bakes `VITE_*` vars into the bundle at build time. The `process.env` trick doesn't work — Vercel must inject them during its build step. If they're missing, `supabase.ts` will log its warning and every query will fail silently with an empty-string URL.

**Why exposing `VITE_SUPABASE_ANON_KEY` is safe:**

The `anon` key is designed to be public. It is not a secret. Its privileges are controlled entirely by Supabase Row Level Security (RLS) policies on the database side — the key itself grants nothing beyond "connect as anonymous user." As long as RLS is enabled on the `wines` and `wine_aromas` tables (which your `schema.sql` should enforce), a person who has your anon key can only read/write rows that your RLS policies allow. For a single-user personal app the practical risk is near zero. The `service_role` key is the one that bypasses RLS — that one must never touch the frontend.

**Create `.env.example` in repo root** (commit this, not `.env`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add `.env` to `.gitignore` if it isn't already.

---

### 1.2 Build Config Changes

**`vite.config.ts` — no `base` path change needed.**

Vercel deploys to the apex of the domain (e.g. `wine.vercel.app`), not a sub-path, so `base: '/'` (the default) is correct. Don't add `base: '/wine/'` unless you're deploying to a subfolder of an existing domain.

**Output dir:** Vite defaults to `dist/`. Vercel auto-detects this for Vite projects. No `vite.config.ts` change needed there either.

**One real `vite.config.ts` change to make:** Add `512x512` maskable icon and fix the manifest. See section 2.2 below.

---

### 1.3 `vercel.json` — SPA Rewrite Rule

Create `vercel.json` in the project root:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

**Why this is required:** React Router (`BrowserRouter`) uses the HTML5 History API. When a user navigates to `/wines/abc123` directly or refreshes the page, Vercel's CDN looks for a file at that path, finds nothing, and returns a 404. The rewrite rule tells Vercel: "for any path that isn't an actual file, serve `index.html` and let the React app handle routing client-side." Without this, every route except `/` 404s on hard reload or direct link.

The negative lookahead `(?!api/)` is a precaution in case you ever add Vercel serverless functions under `/api/`. For your current setup it has no effect but it's the canonical safe pattern.

---

### 1.4 Preview vs Production Deploy Workflow

**Recommended workflow:**

1. Every `git push` to any branch creates a **Preview deployment** at a unique URL (`wine-git-branchname-owen.vercel.app`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the **Preview** environment scope in Vercel — they can point to the same Supabase project (you're solo, no need for a staging DB).

2. Merge to `main` → triggers **Production deployment** automatically.

**[MANUAL] — Connect repo in Vercel:**  
Vercel dashboard → "Add New Project" → import GitHub/GitLab repo → Framework Preset: Vite → Build Command: `npm run build` → Output Directory: `dist` → Add env vars → Deploy.

**Tradeoff — auto-deploy vs manual:** Auto-deploy from `main` means a broken build breaks production. For a solo personal app this is fine — the blast radius is just you. If you want a gate, add a `vercel --prod` CLI step to a GitHub Actions workflow and only deploy after `npm run build` succeeds locally on CI. For now, auto-deploy is the right call.

---

## Phase 2 — PWA + Offline

### 2.1 `registerType`: `autoUpdate` vs `prompt`

**Current setting:** `autoUpdate` — already in `vite.config.ts`.

**Recommendation: keep `autoUpdate`.** Here's the actual tradeoff:

- `autoUpdate`: New service worker installs in the background and takes over on next page reload. User never sees a prompt. Downside: if the user has a tasting form open and the SW updates mid-session, they might get a stale app shell serving a fresh API — but `NetworkFirst` for Supabase mitigates this, and Workbox waits until all tabs are closed before activating.
- `prompt`: Shows a "New version available — reload?" toast. Better UX for multi-user apps where you want users to consciously refresh. Overkill for a personal app you're the only user of.

For a solo personal PWA, `autoUpdate` is strictly better. No action needed.

---

### 2.2 PWA Manifest — Required Additions

**Current gaps in `vite.config.ts` manifest:**
- Only two icon entries — no `purpose: 'maskable'` (required for Android adaptive icons, Chrome install prompt)
- No 180×180 icon (iOS home screen canonical size)
- `masked-icon.svg` is listed in `includeAssets` but the file doesn't exist in `public/`

**Updated `VitePWA` block for `vite.config.ts`:**

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
  // Remove masked-icon.svg from includeAssets — file doesn't exist
  manifest: {
    name: 'Wine Tracker',
    short_name: 'Wines',
    description: 'WSET SAT wine tasting log and analysis',
    theme_color: '#7c2d12',
    background_color: '#1c1917',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        // Maskable variant — required for Android adaptive icon
        // Use the same 512x512 file; ensure the wine icon has
        // safe-zone padding (icon content within inner 80% circle)
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        // Apple needs this for home screen; references apple-touch-icon.png
        // already in public/. Verify it's 180×180.
        src: 'apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    runtimeCaching: [
      {
        // Supabase REST + Auth — NetworkFirst (fresh data preferred, cached fallback)
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-rest-cache',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Supabase Storage (bottle photos) — CacheFirst (images don't change)
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-photos-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Supabase Auth endpoints — NetworkOnly (never cache tokens)
        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
}),
```

**Key reasoning on caching strategies:**
- **App shell (JS/CSS/HTML)** → Workbox precache (already handled by `globPatterns`). StaleWhileRevalidate would be fine but precache is better for a single-user app that controls its own deployment cycle.
- **Supabase REST** → `NetworkFirst` with 5s timeout. You want fresh wine data when online; stale cache when offline. The 5s timeout prevents hanging on a bad connection.
- **Supabase Storage (photos)** → `CacheFirst`. Bottle photos are immutable once uploaded. Cache them aggressively. 30 days, 200 entry cap keeps storage reasonable.
- **Supabase Auth** → `NetworkOnly`. Never cache auth tokens. A cached expired token causes silent failures that are painful to debug.

---

### 2.3 iOS-Specific `index.html` Meta Tags

**Current `index.html`:** Bare minimum — no PWA-specific tags, title still `wine-app`.

**Required additions:**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- Apple PWA tags -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Wines" />

    <!-- Theme color (Android Chrome toolbar, matches manifest) -->
    <meta name="theme-color" content="#7c2d12" />

    <!-- Viewport -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <title>Wine Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Notes on each tag:**
- `apple-touch-icon`: Points to your existing `public/apple-touch-icon.png`. Without this, iOS uses a screenshot as the home screen icon.
- `apple-mobile-web-app-capable`: Enables standalone mode on iOS (hides Safari chrome when launched from home screen).
- `apple-mobile-web-app-status-bar-style: black-translucent`: Status bar overlays the app (matches your dark `#1c1917` background). Use `default` if you want a visible white bar, `black` for a solid black bar.
- `apple-mobile-web-app-title: Wines`: Matches `short_name` in manifest. Keeps the home screen label short.
- `viewport-fit=cover`: Required for iPhone notch/Dynamic Island — content fills the full screen. Pair with `safe-area-inset-*` CSS variables if your `BottomNav` sits near the home indicator. Check that `BottomNav.tsx` has `padding-bottom: env(safe-area-inset-bottom)` or it'll overlap the iPhone home bar.

---

### 2.4 iOS Safari PWA Limitations — Know Before You Ship

These are not bugs in your code. They are iOS platform constraints:

| Limitation | Impact on Wine Tracker | Mitigation |
|---|---|---|
| **No Background Sync API** | `sync` event never fires on iOS; offline queue won't flush automatically | `visibilitychange` flush (see 2.6) |
| **No Web Push** | Can't notify user that offline sync completed | Show in-app badge/toast on next open |
| **Storage quota ~50MB, evictable** | Safari can purge Dexie IndexedDB under storage pressure | Keep queue small; warn user if >20 pending |
| **No install prompt (`beforeinstallprompt`)** | Can't show "Add to Home Screen" button programmatically | Add manual instructions in UI (see 2.5) |
| **Service worker killed on background** | SW does not run while app is backgrounded | Flush on `visibilitychange` instead |
| **Fresh SW on every cold start (iOS 16.3 and earlier)** | Fixed in iOS 16.4+; older devices re-register SW | Mostly a non-issue now |
| **`autoUpdate` SW may not activate until app closed/reopened** | App might run old version for a session | Acceptable for solo use |

**Bottom line:** Your Dexie sync queue and `getPendingQueue` / `markSynced` infrastructure are correct. The missing piece is a flush trigger that works on iOS. See 2.6.

---

### 2.5 iOS Install Instructions (No `beforeinstallprompt`)

Since iOS doesn't support the install prompt, add a one-time dismissable banner somewhere prominent (e.g., `DashboardPage.tsx`):

```tsx
// Show only in mobile Safari, only if not already installed as PWA
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
const showBanner = isSafari && !isStandalone && !localStorage.getItem('iosPromptDismissed')
```

Banner text: *"Install for offline use: tap Share → Add to Home Screen"*

---

### 2.6 Offline Queue Flush Logic (iOS-safe)

**Current state in `syncQueue.ts`:** Queue functions exist (`getPendingQueue`, `markSynced`, `markFailed`) but no flush trigger is wired up anywhere.

**What's needed:** A `flushQueue()` function that processes pending items, and a place to call it that works on iOS.

**`flushQueue` logic to add to `syncQueue.ts`:**

```typescript
export async function flushQueue(): Promise<void> {
  if (!navigator.onLine) return

  const pending = await getPendingQueue()
  if (pending.length === 0) return

  for (const item of pending) {
    try {
      await db.sync_queue.update(item.id!, { status: 'syncing' })

      const { aromas, ...wineData } = item.payload

      // Insert wine row
      const { data: inserted, error } = await supabase
        .from('wines')
        .insert(wineData)
        .select('id')
        .single()

      if (error) throw error

      // Insert aromas if present
      if (aromas?.length && inserted?.id) {
        const aromaRows = aromas.map(a => ({ ...a, wine_id: inserted.id }))
        const { error: aromaErr } = await supabase.from('wine_aromas').insert(aromaRows)
        if (aromaErr) throw aromaErr
      }

      await markSynced(item.id!)
    } catch (err) {
      const attempts = (item.attempts ?? 0) + 1
      if (attempts >= 3) {
        // After 3 failures, mark failed and stop retrying automatically
        await markFailed(item.id!, attempts)
      } else {
        await db.sync_queue.update(item.id!, { status: 'pending', attempts })
      }
      console.error('Sync failed for item', item.client_id, err)
    }
  }
}
```

**Where to wire the trigger — add to `main.tsx` or a top-level `useEffect` in `App.tsx`:**

```typescript
// Flush on page visibility regain (iOS-safe — works when user switches back to app)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    flushQueue()
  }
})

// Flush on online event (works on desktop + Android Chrome)
window.addEventListener('online', () => {
  flushQueue()
})

// Flush on initial load (catches anything that failed last session)
flushQueue()
```

**Why `visibilitychange` instead of Background Sync:** On iOS, the SW `sync` event is simply never fired. `visibilitychange` fires every time the user returns to your app — that's when you have a foreground context and a network connection. It's the correct fallback and it covers 95% of the sync opportunity anyway. The queue was never going to flush while the phone sits in your pocket.

---

### 2.7 User-Facing Offline Indicators

**Current state:** Nothing in the UI communicates online/offline status.

**Recommended minimal implementation:**

1. **`useOnlineStatus` hook** (`src/lib/hooks/useOnlineStatus.ts`):

```typescript
import { useEffect, useState } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return isOnline
}
```

2. **Offline banner** — simple fixed bar above `BottomNav`:

```tsx
// In App.tsx, inside BrowserRouter
const isOnline = useOnlineStatus()
{!isOnline && (
  <div className="fixed bottom-16 inset-x-0 bg-amber-800 text-amber-100 text-sm text-center py-1 z-50">
    Offline — entries will sync when reconnected
  </div>
)}
```

3. **Pending queue badge** on the bottom nav or dashboard: query `getPendingQueue()` on mount, show count if >0. This tells you "3 wines waiting to sync" at a glance.

4. **Post-sync toast:** After `flushQueue()` completes successfully and synced >0 items, show a toast: "3 wines synced to Supabase."

---

### 2.8 Dexie Sync Queue Schema Audit

**Current schema in `syncQueue.ts`:**

```
sync_queue: '++id, client_id, status, created_at'
drafts: '++id, &draft_key, updated_at'
```

**Assessment:** This is correct and sufficient for your use case. Notable design points:

- `++id`: Auto-increment PK. Fine for a local-only queue.
- `client_id`: UUID generated per item. This is the idempotency key — if `flushQueue()` runs twice (e.g., `online` event fires twice in quick succession), a unique constraint on `client_id` in Supabase would prevent duplicate inserts. **[MANUAL] Add a unique constraint on `client_id` in your Supabase `wines` table if you want server-side idempotency.** Alternatively, check the queue item status before re-submitting (already handled — status `syncing` prevents double-processing within a session).
- `&draft_key`: Unique constraint on draft_key in IndexedDB. Correct — prevents duplicate drafts for the same form session.

**One gap:** There's no version migration path if you add columns to `SyncQueueItem` in the future. Dexie handles schema migrations via `version(N).upgrade()`. Not urgent now, but document it.

---

## Phase 3 — Deployment Checklist

### Pre-Deploy

- [ ] Create `vercel.json` with SPA rewrite rule
- [ ] Update `index.html` with iOS meta tags
- [ ] Update `vite.config.ts` manifest (maskable icon entry, remove missing `masked-icon.svg`)
- [ ] Verify `public/apple-touch-icon.png` is 180×180px (open it and check — if it's not, resize)
- [ ] Add `flushQueue()` to `syncQueue.ts`
- [ ] Wire `visibilitychange` + `online` + initial flush in `App.tsx` or `main.tsx`
- [ ] Add `useOnlineStatus` hook and offline banner to `App.tsx`
- [ ] Create `.env.example` and verify `.env` is in `.gitignore`
- [ ] Run `npm run build` locally — confirm clean TypeScript, no errors
- [ ] Run `npx vite preview` and navigate to `localhost:4173/wines/some-id` — should NOT 404 (tests the rewrite locally — note: `vite preview` doesn't apply `vercel.json`, so test this on Vercel preview deploy)

### [MANUAL] Vercel Setup

- [ ] Connect GitHub repo to Vercel
- [ ] Set `VITE_SUPABASE_URL` in Production + Preview environments
- [ ] Set `VITE_SUPABASE_ANON_KEY` in Production + Preview environments
- [ ] Confirm framework is detected as Vite (Build: `npm run build`, Output: `dist`)
- [ ] Trigger first deploy, navigate to `/wines` directly in browser — confirm no 404

### [MANUAL] Supabase Setup

- [ ] Run `src/db/schema.sql` in Supabase SQL Editor
- [ ] Enable RLS on `wines` and `wine_aromas` tables
- [ ] Add RLS policy (for personal solo use, a simple allow-all authenticated or even anon policy works):
  ```sql
  -- Example permissive policy for personal use (you're the only user)
  CREATE POLICY "allow all" ON wines FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "allow all" ON wine_aromas FOR ALL USING (true) WITH CHECK (true);
  ```
- [ ] Confirm `value_score` and `deal_delta` generated columns exist after schema run
- [ ] Create Supabase Storage bucket named `bottle-photos` (if using photo uploads)

### PWA / Offline Testing Checklist

- [ ] **Lighthouse PWA audit** — Chrome DevTools → Lighthouse → PWA. Should score "Installable." Common failures: missing maskable icon, missing `start_url`, missing `theme-color` in HTML.
- [ ] **DevTools offline test** — Network tab → Offline → navigate the app. Dashboard and wine list should load from cache. Submitting a new wine should queue to Dexie (check Application → IndexedDB → wine-tracker → sync_queue).
- [ ] **Reconnect test** — go back online while app is open, verify `flushQueue()` fires and the queued wine appears in Supabase.
- [ ] **iOS install test** — open deployed URL in iPhone Safari → Share → Add to Home Screen → launch from home screen → confirm standalone mode (no Safari URL bar), confirm `apple-touch-icon` appears correctly.
- [ ] **iOS offline form test** — disable iPhone WiFi + cellular → open app → fill wine form → submit → re-enable network → return to app → check wine appears in list.
- [ ] **Safe area check** — on iPhone with notch/Dynamic Island, confirm `BottomNav` doesn't overlap the home indicator bar. Add `pb-safe` or `padding-bottom: env(safe-area-inset-bottom)` to `BottomNav.tsx` if needed.

---

## What Does NOT Need to Change

- `src/lib/supabase.ts` — correct as written. The env var guard and empty-string fallback are fine.
- `src/App.tsx` routing — `BrowserRouter` is correct. Don't switch to `HashRouter` — it's uglier, unnecessary, and breaks deep links.
- `registerType: 'autoUpdate'` — keep it.
- Vite build command (`tsc -b && vite build`) — correct.
- `workbox-window` in dependencies — already installed, no Workbox packages to add.
- The Dexie schema itself — solid.

---

## Summary of File Changes Required

| File | Action | Notes |
|---|---|---|
| `vercel.json` | **Create** | SPA rewrite rule |
| `index.html` | **Edit** | iOS meta tags, title, viewport-fit=cover |
| `vite.config.ts` | **Edit** | Manifest icons (maskable, 180px), remove missing `masked-icon.svg`, split Supabase cache by endpoint type |
| `src/lib/syncQueue.ts` | **Edit** | Add `flushQueue()` function |
| `src/App.tsx` or `src/main.tsx` | **Edit** | Wire flush triggers (`online`, `visibilitychange`, initial) |
| `src/lib/hooks/useOnlineStatus.ts` | **Create** | React hook for `navigator.onLine` |
| `src/App.tsx` | **Edit** | Offline banner using `useOnlineStatus` |
| `.env.example` | **Create** | Template with placeholder values |
| `.gitignore` | **Verify** | `.env` must be listed |
| `public/apple-touch-icon.png` | **Verify** | Confirm 180×180px dimensions |
