import { useRef, useCallback } from "react"
import { useTimeSeries } from "./useTimeSeries"
import type { TimePoint } from "@/lib/types"

/**
 * Tracks cumulative network counters and converts them to a KB/s delta series.
 * Returns [rxSeries, txSeries, addPoint]
 */
export function useNetworkDelta(): [TimePoint[], TimePoint[], (rx: number, tx: number) => void] {
  const [rxSeries, addRx] = useTimeSeries(60)
  const [txSeries, addTx] = useTimeSeries(60)
  const prevRef = useRef<{ rx: number; tx: number; t: number } | null>(null)

  const addPoint = useCallback((rx: number, tx: number) => {
    const now = Date.now()
    if (prevRef.current) {
      const dt = (now - prevRef.current.t) / 1000 // seconds elapsed
      if (dt > 0) {
        const rxKBs = Math.max(0, rx - prevRef.current.rx) / dt / 1024
        const txKBs = Math.max(0, tx - prevRef.current.tx) / dt / 1024
        addRx(rxKBs)
        addTx(txKBs)
      }
    }
    prevRef.current = { rx, tx, t: now }
  }, [addRx, addTx])

  return [rxSeries, txSeries, addPoint]
}
