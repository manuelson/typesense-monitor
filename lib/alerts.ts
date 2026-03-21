import type { HealthResponse, StatsResponse, ParsedMetrics, Alert, AlertLevel } from "@/lib/types"
import { type AlertThresholds, THRESHOLDS_DEFAULTS } from "@/store/settingsStore"

export function computeAlerts(
  health: HealthResponse | undefined,
  metrics: ParsedMetrics | undefined,
  stats: StatsResponse | undefined,
  t: AlertThresholds = THRESHOLDS_DEFAULTS,
): Alert[] {
  const a: Alert[] = []
  if (health && !health.ok) a.push({ level: "red", message: "Health check failing — cluster may be down or unreachable" })
  if (metrics) {
    const cpu = metrics.system_cpu_efficiency_percent_average ?? 0
    if (cpu > t.cpu.red)        a.push({ level: "red",   message: `High CPU usage: ${cpu.toFixed(1)}% (threshold: ${t.cpu.red}%)` })
    else if (cpu > t.cpu.amber) a.push({ level: "amber", message: `Elevated CPU usage: ${cpu.toFixed(1)}% (threshold: ${t.cpu.amber}%)` })

    const mT = metrics.system_memory_total_bytes, mU = metrics.system_memory_used_bytes
    if (mT > 0) {
      const p = (mU / mT) * 100
      if (p > t.memory.red)        a.push({ level: "red",   message: `High memory usage: ${p.toFixed(0)}% (threshold: ${t.memory.red}%)` })
      else if (p > t.memory.amber) a.push({ level: "amber", message: `Elevated memory usage: ${p.toFixed(0)}% (threshold: ${t.memory.amber}%)` })
    }

    const dT = metrics.system_disk_total_bytes ?? 0, dU = metrics.system_disk_used_bytes ?? 0
    if (dT > 0) {
      const p = (dU / dT) * 100
      if (p > t.disk.red)        a.push({ level: "red",   message: `High disk usage: ${p.toFixed(0)}% (threshold: ${t.disk.red}%)` })
      else if (p > t.disk.amber) a.push({ level: "amber", message: `Elevated disk usage: ${p.toFixed(0)}% (threshold: ${t.disk.amber}%)` })
    }
  }
  if (stats) {
    const lat = stats.search_latency_ms ?? 0
    if (lat > t.latency.red)        a.push({ level: "red",   message: `Slow search latency: ${lat.toFixed(0)}ms avg (threshold: ${t.latency.red}ms)` })
    else if (lat > t.latency.amber) a.push({ level: "amber", message: `Elevated search latency: ${lat.toFixed(0)}ms avg (threshold: ${t.latency.amber}ms)` })

    if ((stats.pending_write_batches ?? 0) > t.pendingWrites)
      a.push({ level: "amber", message: `Write backlog: ${stats.pending_write_batches} pending batches (threshold: ${t.pendingWrites})` })

    const SKIP = new Set(["GET /health", "GET /stats.json", "GET /metrics.json"])
    for (const [endpoint, ms] of Object.entries(stats.latency_ms ?? {})) {
      if (SKIP.has(endpoint) || ms === 0) continue
      if (ms > t.endpointLatency.red)        a.push({ level: "red",   message: `Slow endpoint latency: ${endpoint} — ${(ms / 1000).toFixed(1)}s (threshold: ${t.endpointLatency.red}ms)` })
      else if (ms > t.endpointLatency.amber) a.push({ level: "amber", message: `Elevated endpoint latency: ${endpoint} — ${ms.toFixed(0)}ms (threshold: ${t.endpointLatency.amber}ms)` })
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
