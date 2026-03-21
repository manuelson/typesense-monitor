"use client"

import dynamic from "next/dynamic"
import useSWR from "swr"
import { useState, useRef, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { fmtBytes } from "@/lib/format"
import { computeAlerts, overallLevel } from "@/lib/alerts"
import type {
  HealthResponse, StatsResponse, ParsedMetrics,
  DebugResponse, Collection, AlertLevel, LogEntry,
} from "@/lib/types"
import { useTimeSeries } from "@/hooks/useTimeSeries"
import { useNetworkDelta } from "@/hooks/useNetworkDelta"
import { useTerminalStore } from "@/store/terminalStore"
import { useAlertHistoryStore } from "@/store/alertHistoryStore"
import { useStatsCacheStore } from "@/store/statsCacheStore"
import { useSettingsStore } from "@/store/settingsStore"

import { Tile } from "@/components/dashboard/Tile"
import { HeaderBar } from "@/components/dashboard/HeaderBar"
import { HealthBanner } from "@/components/dashboard/HealthBanner"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { CpuChart } from "@/components/dashboard/CpuChart"
import { MemoryChart } from "@/components/dashboard/MemoryChart"
import { LatencyChart } from "@/components/dashboard/LatencyChart"
import { QpsChart } from "@/components/dashboard/QpsChart"
import { NetworkChart } from "@/components/dashboard/NetworkChart"
import { CollectionsTable } from "@/components/dashboard/CollectionsTable"
import { EndpointTable } from "@/components/dashboard/EndpointTable"
import { PeerStatusStrip } from "@/components/dashboard/PeerStatusStrip"
import { AlertHistory } from "@/components/dashboard/AlertHistory"

const DataFlowCanvas = dynamic(
  () => import("@/components/dashboard/DataFlowCanvas").then((m) => m.DataFlowCanvas),
  { ssr: false },
)

const TERMINAL_HEADER_H = 34
const TERMINAL_BODY_H   = 224

const TerminalPanel = dynamic(
  () => import("@/components/dashboard/TerminalPanel").then((m) => m.TerminalPanel),
  { ssr: false },
)

const MAX_LOG = 120

export function Dashboard() {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [activeEps, setActiveEps] = useState<Record<string, boolean>>({})
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const { open: terminalOpen } = useTerminalStore()
  const { addAlerts } = useAlertHistoryStore()
  const cache = useStatsCacheStore()
  const polling    = useSettingsStore((s) => s.polling)
  const paused     = useSettingsStore((s) => s.paused)
  const thresholds = useSettingsStore((s) => s.thresholds)

  // Time series — callback-based, no deduplication bug
  const [cpuSeries,       addCpuPoint]     = useTimeSeries(60)
  const [memorySeries,    addMemoryPoint]  = useTimeSeries(60)
  const [latencySeries,   addLatencyPoint] = useTimeSeries(60)
  const [searchQpsSeries, addSearchQps]    = useTimeSeries(60)
  const [writeQpsSeries,  addWriteQps]     = useTimeSeries(60)
  const [rxSeries, txSeries, addNetPoint]  = useNetworkDelta()

  const addLogRef = useRef<(e: LogEntry) => void>(() => {})
  const addLog = useCallback((entry: LogEntry) => {
    setLogEntries((prev) => {
      const next = [...prev, entry]
      return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next
    })
  }, [])
  addLogRef.current = addLog

  const loggingFetcher = useCallback(async (url: string) => {
    const t0 = Date.now()
    setActiveEps((p) => ({ ...p, [url]: true }))
    let logged = false
    try {
      const res = await fetch(url)
      const data = await res.json()
      addLogRef.current({
        id: `${url}-${t0}`, ts: new Date(), endpoint: url,
        status: res.status, latencyMs: Date.now() - t0,
      })
      logged = true
      // Throw on non-2xx so SWR tracks errors, keeps existing data, skips onSuccess
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      return data
    } catch (err) {
      if (!logged) {
        addLogRef.current({
          id: `${url}-${t0}`, ts: new Date(), endpoint: url, status: 0,
          latencyMs: Date.now() - t0,
          error: err instanceof Error ? err.message : String(err),
        })
      }
      throw err
    } finally {
      setActiveEps((p) => ({ ...p, [url]: false }))
    }
  }, [])

  const { data: health, isLoading: hLoading, error: hError } = useSWR<HealthResponse>(
    paused.health ? null : "/api/health", loggingFetcher,
    {
      refreshInterval: polling.health,
      fallbackData: cache.health ?? undefined,
      onSuccess: (d) => { setLastSync(new Date()); cache.setHealth(d) },
      shouldRetryOnError: true,
      errorRetryInterval: polling.health,
    }
  )

  const { data: stats, error: statsError } = useSWR<StatsResponse>(paused.stats ? null : "/api/stats", loggingFetcher, {
    refreshInterval: polling.stats,
    fallbackData: cache.stats ?? undefined,
    onSuccess: (d) => {
      cache.setStats(d)
      if (d.search_latency_ms !== undefined && (d.search_requests_per_second ?? 0) > 0)
        addLatencyPoint(d.search_latency_ms)
      if (d.search_requests_per_second !== undefined) addSearchQps(d.search_requests_per_second)
      if (d.write_requests_per_second  !== undefined) addWriteQps(d.write_requests_per_second)
    },
  })
  const { data: metrics } = useSWR<ParsedMetrics>(paused.metrics ? null : "/api/metrics", loggingFetcher, {
    refreshInterval: polling.metrics,
    fallbackData: cache.metrics ?? undefined,
    onSuccess: (d) => {
      cache.setMetrics(d)
      if (d.system_cpu_efficiency_percent_average !== undefined)
        addCpuPoint(d.system_cpu_efficiency_percent_average)
      if (d.system_memory_used_bytes !== undefined)
        addMemoryPoint(d.system_memory_used_bytes)
      if (d.system_network_received_bytes !== undefined && d.system_network_sent_bytes !== undefined)
        addNetPoint(d.system_network_received_bytes, d.system_network_sent_bytes)
    },
  })
  const { data: collections } = useSWR<Collection[]>(paused.collections ? null : "/api/collections", loggingFetcher, {
    refreshInterval: polling.collections,
    fallbackData: cache.collections ?? undefined,
    onSuccess: (d) => cache.setCollections(d),
  })
  const { data: debug } = useSWR<DebugResponse>(paused.debug ? null : "/api/debug", loggingFetcher, {
    refreshInterval: polling.debug,
    fallbackData: cache.debug ?? undefined,
    onSuccess: (d) => cache.setDebug(d),
  })

  // noData: health is unauthenticated in Typesense so hError alone isn't enough —
  // stats always requires a valid API key, making statsError the reliable signal.
  const noData = !!hError || !!statsError

  const rawAlerts = computeAlerts(health, metrics, stats, thresholds)
  const alerts    = rawAlerts.filter((a) => !dismissedAlerts.has(a.message))
  const level     = overallLevel(alerts, health)

  const dismissAlert  = useCallback((msg: string) =>
    setDismissedAlerts((s) => new Set([...s, msg])), [])
  const clearAllAlerts = useCallback(() =>
    setDismissedAlerts(new Set(rawAlerts.map((a) => a.message))), [rawAlerts])

  // Record non-green alerts into history (deduplicated by message within a 30s window)
  const lastAlertMessagesRef = useRef<Set<string>>(new Set())
  const lastAlertRecordedAtRef = useRef<number>(0)
  useEffect(() => {
    const nonGreen = alerts.filter((a) => a.level !== "green")
    if (nonGreen.length === 0) {
      lastAlertMessagesRef.current = new Set()
      return
    }
    const now = Date.now()
    const currentMessages = new Set(nonGreen.map((a) => a.message))
    const hasNew = nonGreen.some((a) => !lastAlertMessagesRef.current.has(a.message))
    const stalePeriod = now - lastAlertRecordedAtRef.current > 30_000
    if (hasNew || stalePeriod) {
      addAlerts(nonGreen)
      lastAlertMessagesRef.current = currentMessages
      lastAlertRecordedAtRef.current = now
    }
  }, [alerts, addAlerts])

  const cpu      = metrics?.system_cpu_efficiency_percent_average ?? 0
  const memUsed  = metrics?.system_memory_used_bytes ?? 0
  const memTotal = metrics?.system_memory_total_bytes ?? 0
  const memPct   = memTotal > 0 ? ((memUsed / memTotal) * 100).toFixed(0) : "—"
  const diskUsed  = metrics?.system_disk_used_bytes ?? 0
  const diskTotal = metrics?.system_disk_total_bytes ?? 0

  const memPct2 = memTotal > 0 ? (memUsed / memTotal) * 100 : 0
  const diskPct = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0
  const lat     = stats?.search_latency_ms ?? 0

  const cpuLevel:     AlertLevel = cpu > thresholds.cpu.red             ? "red" : cpu > thresholds.cpu.amber             ? "amber" : "green"
  const memLevel:     AlertLevel = memTotal > 0 ? memPct2 > thresholds.memory.red  ? "red" : memPct2 > thresholds.memory.amber  ? "amber" : "green" : "green"
  const latLevel:     AlertLevel = lat > thresholds.latency.red          ? "red" : lat > thresholds.latency.amber          ? "amber" : "green"
  const diskLevel:    AlertLevel = diskTotal > 0 ? diskPct > thresholds.disk.red   ? "red" : diskPct > thresholds.disk.amber   ? "amber" : "green" : "green"
  const pendingLevel: AlertLevel = (stats?.pending_write_batches ?? 0) > thresholds.pendingWrites ? "amber" : "green"

  const peerCount = debug?.peers ? Object.keys(debug.peers).length : undefined

  const terminalH = TERMINAL_HEADER_H + (terminalOpen ? TERMINAL_BODY_H : 0)

  // Show skeleton only on true first load (no cache, not a no-data/misconfigured state).
  const isLoading = hLoading && !health && !stats && !metrics && !cache.health && !noData

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-400"
      style={{ paddingBottom: terminalH + 8 }}
    >
      <HeaderBar version={debug?.version} lastSync={lastSync} peerCount={peerCount} raftState={debug?.state} />
      <PeerStatusStrip debug={debug} />
      <HealthBanner level={level} alerts={alerts} loading={hLoading && !health}
        noData={noData} onDismiss={dismissAlert} onClearAll={clearAllAlerts} />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DashboardSkeleton />
          </motion.div>
        ) : (
          <motion.main
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-4 max-w-[1800px] mx-auto space-y-3"
          >

        {/* ── Metrics ── */}
        <div className="space-y-2">
          {/* Primary — 5 large tiles, scrollable on mobile */}
          <div className="overflow-x-auto scrollbar-none">
            <div className="grid grid-cols-5 gap-2 min-w-[560px]">
              <Tile large label="Search QPS"
                value={stats?.search_requests_per_second?.toFixed(1) ?? "—"} unit="rps"
                sub="searches / sec"
                hint="Search queries per second. Spikes may indicate missing indexes or under-provisioned replicas."
                source="GET /stats.json → search_requests_per_second"
              />
              <Tile large label="Write QPS"
                value={stats?.write_requests_per_second?.toFixed(1) ?? "—"} unit="rps"
                sub="writes / sec"
                hint="Document writes per second (imports, upserts, deletes). High write load competes with search throughput."
                source="GET /stats.json → write_requests_per_second"
              />
              <Tile large label="Search Latency" level={latLevel}
                value={stats?.search_latency_ms?.toFixed(0) ?? "—"} unit="ms"
                sub={`import: ${stats?.import_latency_ms?.toFixed(0) ?? "—"} ms`}
                hint="Avg search latency. Only recorded when searches are active. Amber >100 ms, red >500 ms."
                source="GET /stats.json → search_latency_ms"
              />
              <Tile large label="CPU" level={cpuLevel}
                value={cpu > 0 ? cpu.toFixed(1) : "—"} unit="%"
                sub={`1 min avg: ${metrics?.system_cpu_efficiency_percent_last_minute?.toFixed(1) ?? "—"} %`}
                hint="Overall CPU usage across all cores. Amber >70 %, red >90 %."
                source="GET /metrics.json → system_cpu_active_percentage"
              />
              <Tile large label="Memory" level={memLevel}
                value={memPct} unit="%"
                sub={`${fmtBytes(memUsed)} / ${fmtBytes(memTotal)}`}
                hint="System RAM in use. Amber >80 %, red >95 %. Typesense keeps indexes in memory."
                source="GET /metrics.json → system_memory_used_bytes / total"
              />
            </div>
          </div>

          {/* Secondary — 5 small tiles */}
          <div className="overflow-x-auto scrollbar-none">
            <div className="grid grid-cols-5 gap-2 min-w-[560px]">
              <Tile label="Total QPS"
                value={stats?.total_requests_per_second?.toFixed(1) ?? "—"} unit="rps"
                hint="All request types combined: search + write + delete + import."
                source="GET /stats.json → total_requests_per_second"
              />
              <Tile label="Disk" level={diskLevel}
                value={diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(0) : "—"} unit="%"
                sub={`${fmtBytes(diskUsed)} / ${fmtBytes(diskTotal)}`}
                hint="Disk space used. Amber >80 %, red >95 %. Typesense stores indexes on disk."
                source="GET /metrics.json → system_disk_used_bytes / total"
              />
              <Tile label="Pending Writes" level={pendingLevel}
                value={String(stats?.pending_write_batches ?? "—")}
                sub="write batches"
                hint="Write batches queued but not yet applied. Growing queue = writes outpacing disk."
                source="GET /stats.json → pending_write_batches"
              />
              <Tile label="Net RX"
                value={fmtBytes(metrics?.system_network_received_bytes ?? 0)}
                sub="received since start"
                hint="Total bytes received by this node since process start (cumulative, not rate)."
                source="GET /metrics.json → system_network_received_bytes"
              />
              <Tile label="Net TX"
                value={fmtBytes(metrics?.system_network_sent_bytes ?? 0)}
                sub="sent since start"
                hint="Total bytes sent by this node since process start (cumulative, not rate)."
                source="GET /metrics.json → system_network_sent_bytes"
              />
            </div>
          </div>
        </div>

        {/* ── Hero panel: charts left | DataFlow center (no box) | charts right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-3 items-stretch">

          {/* Left column: 2 charts stacked */}
          <div className="grid grid-rows-2 gap-3 h-full">
            <LatencyChart data={latencySeries}                                    stretch collapsible={false} />
            <CpuChart     data={cpuSeries}                                        stretch collapsible={false} />
          </div>

          {/* Center: raw canvas, no card wrapper */}
          <div className="min-h-[420px]">
            <DataFlowCanvas active={activeEps} />
          </div>

          {/* Right column: 2 charts stacked */}
          <div className="grid grid-rows-2 gap-3 h-full">
            <QpsChart    searchData={searchQpsSeries} writeData={writeQpsSeries} stretch collapsible={false} />
            <MemoryChart data={memorySeries} totalBytes={memTotal}               stretch collapsible={false} />
          </div>
        </div>

        {/* ── Per-endpoint breakdown ── */}
        <EndpointTable stats={stats} />

        {/* ── Network I/O + Alert History ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <NetworkChart rxData={rxSeries} txData={txSeries} collapsible={false} />
          <AlertHistory />
        </div>

        {/* ── Collections ── */}
        <CollectionsTable collections={!noData && Array.isArray(collections) ? collections : []} />

          </motion.main>
        )}
      </AnimatePresence>

      {/* ── Fixed bottom terminal (VSCode style) ── */}
      <TerminalPanel entries={logEntries} active={activeEps} />
    </div>
  )
}
