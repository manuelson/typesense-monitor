import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AlertLevel } from "@/lib/types"

export interface AlertHistoryEntry {
  id: string
  ts: number       // Unix ms
  level: AlertLevel
  message: string
}

interface AlertHistoryState {
  entries: AlertHistoryEntry[]
  addAlerts: (alerts: { level: AlertLevel; message: string }[]) => void
  remove: (id: string) => void
  clear: () => void
}

const MAX_ENTRIES = 200

export const useAlertHistoryStore = create<AlertHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addAlerts: (alerts) => {
        if (alerts.length === 0) return
        const now = Date.now()
        const newEntries: AlertHistoryEntry[] = alerts.map((a, i) => ({
          id: `${now}-${i}`,
          ts: now,
          level: a.level,
          message: a.message,
        }))
        set((s) => {
          const combined = [...s.entries, ...newEntries]
          return {
            entries: combined.length > MAX_ENTRIES
              ? combined.slice(combined.length - MAX_ENTRIES)
              : combined,
          }
        })
      },
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "typesense-alert-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
