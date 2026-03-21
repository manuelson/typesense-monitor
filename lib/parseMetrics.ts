import type { MetricsResponse } from "typesense/lib/Typesense/Metrics"
import type { ParsedMetrics } from "./types"

export function parseMetricsJson(raw: MetricsResponse): ParsedMetrics {
  // MetricsResponse values are all strings — coerce to numbers.
  // Cast through unknown for iteration since the SDK type has no catch-all index sig.
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as unknown as Record<string, string | number>)) {
    const n = typeof v === "number" ? v : parseFloat(v as string)
    if (!isNaN(n)) result[k] = n
  }

  // Use the pre-computed overall CPU if available (system_cpu_active_percentage),
  // otherwise average the per-core fields (system_cpuN_active_percentage).
  if (!result.system_cpu_efficiency_percent_average) {
    if (result.system_cpu_active_percentage !== undefined) {
      result.system_cpu_efficiency_percent_average = result.system_cpu_active_percentage
    } else {
      const cpuKeys = Object.keys(result).filter((k) => /^system_cpu\d+_active_percentage$/.test(k))
      if (cpuKeys.length > 0) {
        result.system_cpu_efficiency_percent_average =
          cpuKeys.reduce((s, k) => s + result[k], 0) / cpuKeys.length
      }
    }
    result.system_cpu_efficiency_percent_last_minute ??=
      result.system_cpu_efficiency_percent_average ?? 0
  }

  return result as ParsedMetrics
}

// Keep old export name so nothing else breaks if referenced
export const parsePrometheusMetrics = parseMetricsJson
