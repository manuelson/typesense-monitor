// ─── Typesense SDK response types ──────────────────────────────────────────
// Re-exported so the rest of the codebase imports from a single place.

export type { HealthResponse } from "typesense/lib/Typesense/Health"
export type { StatsResponse, EndpointStats } from "typesense/lib/Typesense/Stats"
export type { MetricsResponse } from "typesense/lib/Typesense/Metrics"
export type {
  CollectionSchema as Collection,
  CollectionFieldSchema as CollectionField,
  FieldType,
} from "typesense/lib/Typesense/Collection"

// DebugResponseSchema only has { state, version } — extend it with the
// undocumented `peers` field that Typesense returns on clustered nodes.
import type { DebugResponseSchema } from "typesense/lib/Typesense/Debug"
export interface DebugResponse extends DebugResponseSchema {
  peers?: Record<string, { state: string; last_contact_ms: number }>
}

// ─── Post-processed metrics ─────────────────────────────────────────────────
// MetricsResponse returns all values as strings; parseMetricsJson converts
// them to numbers and synthesises the CPU average field.
export interface ParsedMetrics {
  system_cpu_efficiency_percent_average: number
  system_cpu_efficiency_percent_last_minute: number
  system_disk_total_bytes: number
  system_disk_used_bytes: number
  system_memory_total_bytes: number
  system_memory_used_bytes: number
  system_network_received_bytes: number
  system_network_sent_bytes: number
  typesense_memory_active_bytes: number
  typesense_memory_allocated_bytes: number
  typesense_memory_fragmentation_ratio: number
  typesense_memory_mapped_bytes: number
  typesense_memory_metadata_bytes: number
  typesense_memory_resident_bytes: number
  typesense_memory_retained_bytes: number
  typesense_memory_used_bytes: number
  [key: string]: number
}

// ─── Internal app types ─────────────────────────────────────────────────────
export type AlertLevel = "green" | "amber" | "red"
export interface Alert {
  level: AlertLevel
  message: string
}

export interface TimePoint {
  t: number // Unix ms
  v: number
}

export interface LogEntry {
  id: string
  ts: Date
  endpoint: string
  status: number
  latencyMs: number
  error?: string
}
