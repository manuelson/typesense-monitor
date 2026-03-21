import type { HealthResponse, StatsResponse, ParsedMetrics, Alert, AlertLevel } from "@/lib/types"
import { type AlertThresholds, THRESHOLDS_DEFAULTS } from "@/store/settingsStore"

export function computeAlerts(
  health: HealthResponse | undefined,
  metrics: ParsedMetrics | undefined,
  stats: StatsResponse | undefined,
  t: AlertThresholds = THRESHOLDS_DEFAULTS,
): Alert[] {
  const a: Alert[] = []
  if (health && !health.ok) a.push({ level: "red", message: "Cluster health check failing" })
  if (metrics) {
    const cpu = metrics.system_cpu_efficiency_percent_average ?? 0
    if (cpu > t.cpu.red)        a.push({ level: "red",   message: `CPU critical: ${cpu.toFixed(1)}%` })
    else if (cpu > t.cpu.amber) a.push({ level: "amber", message: `CPU high: ${cpu.toFixed(1)}%` })

    const mT = metrics.system_memory_total_bytes, mU = metrics.system_memory_used_bytes
    if (mT > 0) {
      const p = (mU / mT) * 100
      if (p > t.memory.red)        a.push({ level: "red",   message: `Memory critical: ${p.toFixed(0)}%` })
      else if (p > t.memory.amber) a.push({ level: "amber", message: `Memory high: ${p.toFixed(0)}%` })
    }

    const dT = metrics.system_disk_total_bytes ?? 0, dU = metrics.system_disk_used_bytes ?? 0
    if (dT > 0) {
      const p = (dU / dT) * 100
      if (p > t.disk.red)        a.push({ level: "red",   message: `Disk critical: ${p.toFixed(0)}%` })
      else if (p > t.disk.amber) a.push({ level: "amber", message: `Disk high: ${p.toFixed(0)}%` })
    }
  }
  if (stats) {
    const lat = stats.search_latency_ms ?? 0
    if (lat > t.latency.red)        a.push({ level: "red",   message: `Search latency critical: ${lat.toFixed(0)}ms` })
    else if (lat > t.latency.amber) a.push({ level: "amber", message: `Search latency high: ${lat.toFixed(0)}ms` })

    if ((stats.pending_write_batches ?? 0) > t.pendingWrites)
      a.push({ level: "amber", message: `Pending writes: ${stats.pending_write_batches}` })

    const SKIP = new Set(["GET /health", "GET /stats.json", "GET /metrics.json"])
    for (const [endpoint, ms] of Object.entries(stats.latency_ms ?? {})) {
      if (SKIP.has(endpoint) || ms === 0) continue
      const parts = endpoint.split(" ")
      const method = parts[0]
      const segs   = (parts[1] ?? "").split("/").filter(Boolean)
      const label  = segs.length > 2
        ? `${method} /…/${segs.slice(-2).join("/")}`
        : endpoint
      if (ms > t.endpointLatency.red)        a.push({ level: "red",   message: `${label}: ${(ms / 1000).toFixed(1)}s` })
      else if (ms > t.endpointLatency.amber) a.push({ level: "amber", message: `${label}: ${ms.toFixed(0)}ms` })
    }
  }
  return a
}

export function overallLevel(alerts: Alert[], health: HealthResponse | undefined): AlertLevel {
  if (!health) return "amber"
  if (alerts.some((a) => a.level === "red")) return "red"
  if (alerts.some((a) => a.level === "amber")) return "amber"
  return "green"
}
