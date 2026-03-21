import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface TerminalState {
  open: boolean
  autoScroll: boolean
  toggleOpen: () => void
  toggleAutoScroll: () => void
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set) => ({
      open: false,
      autoScroll: true,
      toggleOpen:       () => set((s) => ({ open:       !s.open       })),
      toggleAutoScroll: () => set((s) => ({ autoScroll: !s.autoScroll })),
    }),
    {
      name: "typesense-terminal",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
