"use client"

import { useState, useCallback } from "react"
import type { TimePoint } from "@/lib/types"

/**
 * Returns [series, addPoint, reset].
 * Call addPoint(value) explicitly on each poll — avoids the React useEffect
 * deduplication issue where equal values don't trigger re-runs.
 */
export function useTimeSeries(max = 60): readonly [TimePoint[], (v: number) => void, () => void] {
  const [series, setSeries] = useState<TimePoint[]>([])

  const addPoint = useCallback((v: number) => {
    setSeries((prev) => {
      const next = [...prev, { t: Date.now(), v }]
      return next.length > max ? next.slice(next.length - max) : next
    })
  }, [max])

  const reset = useCallback(() => setSeries([]), [])

  return [series, addPoint, reset] as const
}
