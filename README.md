# Typesense Stats

A real-time monitoring dashboard for [Typesense](https://typesense.org) clusters, built with Next.js 16, React 19, and Tailwind CSS v4.

---

## Features

- **Live metrics** — CPU, memory, disk, search/write QPS, search latency, network I/O
- **Alert system** — color-coded banners (green / amber / red) with configurable thresholds and dismissal
- **Alert history** — log of non-green events deduplicated within 30-second windows
- **Time-series charts** — rolling 60-point history for CPU, memory, latency, QPS, and network delta
- **Collections table** — lists all Typesense collections with field schemas
- **Per-endpoint latency table** — breakdown of every API endpoint's average latency
- **Peer status strip** — cluster node states and last-contact times (HA deployments)
- **Data-flow canvas** — animated visualization of active API calls
- **Terminal panel** — VS Code–style log of every fetch: endpoint, HTTP status, latency, errors
- **Settings sheet** — tune polling intervals, alert thresholds, and warning colors; all persisted via `localStorage`

---

## Requirements

- Node.js 20+
- A running Typesense instance (v0.25+ recommended)
- A Typesense API key with at minimum read access to `/health`, `/stats.json`, `/metrics.json`, `/collections`, and `/debug`

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the project root:

```env
TYPESENSE_HOST=https://your-typesense-host:8108
TYPESENSE_API_KEY=your-api-key
```

| Variable            | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `TYPESENSE_HOST`    | Full URL including protocol and port, e.g. `https://search.example.com:443`  |
| `TYPESENSE_API_KEY` | Admin or read-only API key with access to the monitoring endpoints           |

Both variables are read **server-side only** (Next.js Route Handlers). They are never exposed to the browser.

### 3. Run in development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm start
```

---

## Architecture

### API Routes (`app/api/`)

Each route is a thin Next.js Route Handler that calls the Typesense SDK and forwards the response. All routes are `force-dynamic` (no caching at the framework layer).

| Route                  | Typesense endpoint   | Description                         |
| ---------------------- | -------------------- | ----------------------------------- |
| `GET /api/health`      | `GET /health`        | Cluster health status               |
| `GET /api/stats`       | `GET /stats.json`    | QPS, latency, pending writes        |
| `GET /api/metrics`     | `GET /metrics.json`  | CPU, memory, disk, network bytes    |
| `GET /api/collections` | `GET /collections`   | All collection schemas              |
| `GET /api/debug`       | `GET /debug`         | Node version, Raft state, peer list |

The Typesense client is a singleton (`lib/typesense.ts`) initialised once per server process from the two environment variables.

### Data Flow

```
Browser
  └─ SWR (per endpoint, configurable interval)
       └─ /api/* Route Handler
            └─ Typesense SDK singleton
                 └─ Typesense cluster
```

SWR is configured with:
- **`refreshInterval`** — from `settingsStore` (default: 5 s for health/stats/metrics, 10 s for collections, 30 s for debug)
- **`fallbackData`** — last known value from the Zustand stats-cache store, so the UI never goes blank on a transient error
- **`onSuccess`** — appends the latest point to time-series state and writes the value into the cache store
- **`shouldRetryOnError: true`** — retries on failure at the same interval

### Component Tree

```
Page
└─ Dashboard  (components/dashboard/Dashboard.tsx)
    ├─ HeaderBar          — title, version, last-sync time, peer count, Raft state
    ├─ PeerStatusStrip    — per-peer health row (hidden when not clustered)
    ├─ HealthBanner       — alert level badge + dismissable alert pills
    ├─ DashboardSkeleton  — shown only on first load (no cached data yet)
    ├─ Tile (×10)         — individual metric cards (large + small rows)
    ├─ LatencyChart       — Recharts area chart, rolling 60-point series
    ├─ CpuChart           — same pattern
    ├─ DataFlowCanvas     — canvas-based animated node graph (client-only, no SSR)
    ├─ QpsChart           — dual-series (search + write)
    ├─ MemoryChart        — absolute bytes + total line
    ├─ EndpointTable      — per-endpoint latency + request count
    ├─ NetworkChart       — RX/TX delta series
    ├─ AlertHistory       — time-stamped log of past amber/red events
    ├─ CollectionsTable   — collection name, document count, fields
    └─ TerminalPanel      — fixed bottom panel, VS Code style (client-only, no SSR)
```

`DataFlowCanvas` and `TerminalPanel` are loaded with `next/dynamic` and `{ ssr: false }` because they rely on browser-only APIs (canvas, DOM measurements).

### State Management (Zustand stores)

| Store (`store/`)    | Purpose                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `settingsStore`     | Polling intervals, pause flags, alert thresholds, warning colors — persisted to `localStorage`   |
| `statsCacheStore`   | Last-known value for each API endpoint — used as SWR `fallbackData`                              |
| `alertHistoryStore` | Append-only log of non-green alert snapshots with timestamps                                     |
| `terminalStore`     | Whether the terminal panel is open/collapsed                                                     |

### Alert Logic (`lib/alerts.ts`)

`computeAlerts()` checks all live metrics against configurable thresholds and returns a typed `Alert[]`. `overallLevel()` reduces that list to a single `AlertLevel` for the header banner. The Dashboard deduplicates alerts into `alertHistoryStore` with a 30-second re-fire window to avoid flooding the log.

Default thresholds:

| Metric           | Amber      | Red         |
| ---------------- | ---------- | ----------- |
| CPU              | > 70 %     | > 90 %      |
| Memory           | > 80 %     | > 95 %      |
| Disk             | > 80 %     | > 95 %      |
| Search latency   | > 100 ms   | > 500 ms    |
| Pending writes   | > 10       | —           |
| Endpoint latency | > 1 000 ms | > 10 000 ms |

### Hooks (`hooks/`)

| Hook                | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `useTimeSeries`     | Returns a capped rolling array of `{ t, v }` points and an `addPoint` callback          |
| `useNetworkDelta`   | Converts cumulative byte counters into per-interval delta series (RX and TX separately) |

---

## Project Structure

```
typesense-stats/
├── app/
│   ├── api/
│   │   ├── health/route.ts
│   │   ├── stats/route.ts
│   │   ├── metrics/route.ts
│   │   ├── collections/route.ts
│   │   └── debug/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
├── components/
│   ├── dashboard/        — feature components
│   └── ui/               — shadcn/ui primitives (card, badge, table, tabs, …)
├── hooks/
├── lib/
│   ├── alerts.ts         — alert computation logic
│   ├── format.ts         — byte/number formatters
│   ├── parseMetrics.ts   — converts string metrics to numbers
│   ├── types.ts          — shared TypeScript types
│   └── typesense.ts      — SDK singleton + env parsing
└── store/
```

---

## Pull Request Policy

### Branching

- Branch from `main`. Use the naming convention `<type>/<short-description>`.
  - Examples: `feat/add-disk-chart`, `fix/memory-pct-zero`, `chore/update-deps`
- Accepted types: `feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, `test`

### Before Opening a PR

1. **Lint passes** — `npm run lint` must exit clean. PRs with lint errors will not be reviewed.
2. **Build passes** — `npm run build` must complete without errors.
3. **Manual smoke test** — verify the dashboard loads and data flows correctly against a real or local Typesense instance.
4. **Scope** — one concern per PR. Do not bundle unrelated refactors with feature work.

### PR Description

Every PR must include:

- **What** — a concise summary of the change.
- **Why** — the motivation or problem being solved.
- **How to test** — steps a reviewer can follow to verify the change works.
- Screenshots or a screen recording for any UI changes.

### Review Requirements

- At least **one approving review** before merge.
- Resolve all review threads before merging.
- Do not merge your own PR without a review, except for trivial documentation fixes.

### Merge Strategy

- **Squash and merge** for all feature branches and bug fixes — keeps `main` history clean and bisectable.
- **Merge commit** is acceptable for long-running integration branches only.
- Rebase your branch on `main` before requesting review if it has diverged.

### What NOT to include in a PR

- Secrets, API keys, or credentials of any kind.
- Generated build artifacts (`/.next`, `/node_modules`).
- Large binary files.
- Changes to `.env.local` (gitignored, machine-specific).

---

## Tech Stack

| Library       | Version | Role                                    |
| ------------- | ------- | --------------------------------------- |
| Next.js       | 16.2    | Framework, routing, API routes          |
| React         | 19.2    | UI rendering                            |
| Tailwind CSS  | 4       | Styling                                 |
| shadcn/ui     | —       | Accessible UI primitives (Radix-based)  |
| SWR           | 2.4     | Data fetching and polling               |
| Zustand       | 5.0     | Client state (settings, cache, history) |
| Recharts      | 3.8     | Time-series charts                      |
| Framer Motion | 12      | Page and skeleton transitions           |
| Typesense SDK | 3.0     | Typesense API client (server-side only) |
| lucide-react  | 0.577   | Icons                                   |
