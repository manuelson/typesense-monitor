import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  HealthResponse, StatsResponse, ParsedMetrics,
  DebugResponse, Collection,
} from "@/lib/types"

interface StatsCacheState {
  health:      HealthResponse  | null
  stats:       StatsResponse   | null
  metrics:     ParsedMetrics   | null
  collections: Collection[]    | null
  debug:       DebugResponse   | null

  setHealth:      (d: HealthResponse)  => void
  setStats:       (d: StatsResponse)   => void
  setMetrics:     (d: ParsedMetrics)   => void
  setCollections: (d: Collection[])    => void
  setDebug:       (d: DebugResponse)   => void
  reset:          () => void
}

export const useStatsCacheStore = create<StatsCacheState>()(
  persist(
    (set) => ({
      health:      null,
      stats:       null,
      metrics:     null,
      collections: null,
      debug:       null,

      setHealth:      (d) => set({ health:      d }),
      setStats:       (d) => set({ stats:       d }),
      setMetrics:     (d) => set({ metrics:     d }),
      setCollections: (d) => set({ collections: d }),
      setDebug:       (d) => set({ debug:       d }),
      reset: () => set({ health: null, stats: null, metrics: null, collections: null, debug: null }),
    }),
    {
      name: "typesense-stats-cache",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
