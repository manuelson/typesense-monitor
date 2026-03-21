import { create } from "zustand"
import { persist } from "zustand/middleware"

// ── Polling intervals (ms) ────────────────────────────────────────────────────

export interface PollingConfig {
  health:      number
  stats:       number
  metrics:     number
  collections: number
  debug:       number
}

export const POLLING_DEFAULTS: PollingConfig = {
  health:      5_000,
  stats:       5_000,
  metrics:     5_000,
  collections: 10_000,
  debug:       30_000,
}

// ── Alert thresholds ──────────────────────────────────────────────────────────

export interface AlertThresholds {
  cpu:              { amber: number; red: number }   // %
  memory:           { amber: number; red: number }   // %
  latency:          { amber: number; red: number }   // ms
  disk:             { amber: number; red: number }   // %
  pendingWrites:    number                           // count (amber only)
  endpointLatency:  { amber: number; red: number }   // ms
}

export const THRESHOLDS_DEFAULTS: AlertThresholds = {
  cpu:             { amber: 70,    red: 90    },
  memory:          { amber: 80,    red: 95    },
  latency:         { amber: 100,   red: 500   },
  disk:            { amber: 80,    red: 95    },
  pendingWrites:   10,
  endpointLatency: { amber: 1_000, red: 10_000 },
}

// ── Alert colors ──────────────────────────────────────────────────────────────

export type AmberColor = "amber" | "yellow" | "orange"
export type RedColor   = "red"   | "rose"   | "pink"

export interface AlertColors {
  amber: AmberColor
  red:   RedColor
}

export const COLORS_DEFAULTS: AlertColors = {
  amber: "amber",
  red:   "red",
}

// Color → Tailwind class maps (fully static so Tailwind includes them in bundle)
export const AMBER_CLASSES: Record<AmberColor, {
  text: string; bg: string; border: string; dot: string
  entry: string         // alert row (AlertHistory)
  stateEntry: string    // peer pill when state unknown (PeerStatusStrip)
  stateBadge: string    // badge inside peer pill
  latText: string       // latency / status code text
  bar: string           // progress bar bg (EndpointTable)
  borderAccent: string  // left-border accent (StatCard)
  hex: string           // SVG stroke/fill color (LatencyChart)
}> = {
  amber: {
    text: "text-amber-400",  bg: "bg-amber-950",  border: "border-amber-900",  dot: "bg-amber-400",
    entry:       "text-amber-400 border-amber-500/20 bg-amber-500/5",
    stateEntry:  "text-amber-400 bg-amber-400/10 border-amber-500/30",
    stateBadge:  "text-amber-300 border-amber-500/40 bg-amber-500/10",
    latText: "text-amber-400", bar: "bg-amber-500", borderAccent: "border-l-amber-700", hex: "#f59e0b",
  },
  yellow: {
    text: "text-yellow-400", bg: "bg-yellow-950", border: "border-yellow-900", dot: "bg-yellow-400",
    entry:       "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
    stateEntry:  "text-yellow-400 bg-yellow-400/10 border-yellow-500/30",
    stateBadge:  "text-yellow-300 border-yellow-500/40 bg-yellow-500/10",
    latText: "text-yellow-400", bar: "bg-yellow-500", borderAccent: "border-l-yellow-700", hex: "#eab308",
  },
  orange: {
    text: "text-orange-400", bg: "bg-orange-950", border: "border-orange-900", dot: "bg-orange-400",
    entry:       "text-orange-400 border-orange-500/20 bg-orange-500/5",
    stateEntry:  "text-orange-400 bg-orange-400/10 border-orange-500/30",
    stateBadge:  "text-orange-300 border-orange-500/40 bg-orange-500/10",
    latText: "text-orange-400", bar: "bg-orange-500", borderAccent: "border-l-orange-700", hex: "#f97316",
  },
}

export const RED_CLASSES: Record<RedColor, {
  text: string; bg: string; border: string; dot: string
  entry: string
  latText: string
  bar: string
  borderAccent: string
  hex: string
}> = {
  red:  {
    text: "text-red-400",  bg: "bg-red-950",  border: "border-red-900",  dot: "bg-red-400",
    entry: "text-red-400 border-red-500/20 bg-red-500/5",
    latText: "text-red-400", bar: "bg-red-500", borderAccent: "border-l-red-700", hex: "#ef4444",
  },
  rose: {
    text: "text-rose-400", bg: "bg-rose-950", border: "border-rose-900", dot: "bg-rose-400",
    entry: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    latText: "text-rose-400", bar: "bg-rose-500", borderAccent: "border-l-rose-700", hex: "#f43f5e",
  },
  pink: {
    text: "text-pink-400", bg: "bg-pink-950", border: "border-pink-900", dot: "bg-pink-400",
    entry: "text-pink-400 border-pink-500/20 bg-pink-500/5",
    latText: "text-pink-400", bar: "bg-pink-500", borderAccent: "border-l-pink-700", hex: "#ec4899",
  },
}

// ── Store ─────────────────────────────────────────────────────────────────────

export type PausedConfig = Record<keyof PollingConfig, boolean>

interface SettingsState {
  polling:    PollingConfig
  paused:     PausedConfig
  thresholds: AlertThresholds
  colors:     AlertColors

  setPolling:      (key: keyof PollingConfig, value: number) => void
  togglePause:     (key: keyof PollingConfig) => void
  setThreshold:    (metric: keyof AlertThresholds, level: "amber" | "red" | "value", value: number) => void
  setColor:        (level: "amber" | "red", color: AmberColor | RedColor) => void
  resetPolling:    () => void
  resetThresholds: () => void
  resetColors:     () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      polling: { ...POLLING_DEFAULTS },
      paused:  { health: false, stats: false, metrics: false, collections: false, debug: false },
      thresholds: {
        cpu:             { ...THRESHOLDS_DEFAULTS.cpu },
        memory:          { ...THRESHOLDS_DEFAULTS.memory },
        latency:         { ...THRESHOLDS_DEFAULTS.latency },
        disk:            { ...THRESHOLDS_DEFAULTS.disk },
        pendingWrites:   THRESHOLDS_DEFAULTS.pendingWrites,
        endpointLatency: { ...THRESHOLDS_DEFAULTS.endpointLatency },
      },
      colors: { ...COLORS_DEFAULTS },

      setPolling: (key, value) =>
        set((s) => ({ polling: { ...s.polling, [key]: value } })),

      togglePause: (key) =>
        set((s) => ({ paused: { ...s.paused, [key]: !s.paused[key] } })),

      setThreshold: (metric, level, value) =>
        set((s) => {
          const prev = s.thresholds[metric]
          if (typeof prev === "number") {
            return { thresholds: { ...s.thresholds, [metric]: value } }
          }
          return {
            thresholds: {
              ...s.thresholds,
              [metric]: { ...(prev as object), [level]: value },
            },
          }
        }),

      setColor: (level, color) =>
        set((s) => ({ colors: { ...s.colors, [level]: color } })),

      resetPolling:    () => set({ polling:    { ...POLLING_DEFAULTS } }),
      resetThresholds: () => set({
        thresholds: {
          cpu:             { ...THRESHOLDS_DEFAULTS.cpu },
          memory:          { ...THRESHOLDS_DEFAULTS.memory },
          latency:         { ...THRESHOLDS_DEFAULTS.latency },
          disk:            { ...THRESHOLDS_DEFAULTS.disk },
          pendingWrites:   THRESHOLDS_DEFAULTS.pendingWrites,
          endpointLatency: { ...THRESHOLDS_DEFAULTS.endpointLatency },
        },
      }),
      resetColors: () => set({ colors: { ...COLORS_DEFAULTS } }),
    }),
    { name: "typesense-settings" },
  ),
)
