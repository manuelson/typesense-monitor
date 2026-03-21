"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Terminal, ArrowDownToLine } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LogEntry } from "@/lib/types"
import { useTerminalStore } from "@/store/terminalStore"
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore"

const EP: Record<string, { color: string; dot: string; short: string; label: string }> = {
  "/api/health":      { color: "text-green-400",  dot: "bg-green-400",  short: "/health      ", label: "HLTH" },
  "/api/stats":       { color: "text-purple-400", dot: "bg-purple-400", short: "/stats.json  ", label: "STAT" },
  "/api/metrics":     { color: "text-blue-400",   dot: "bg-blue-400",   short: "/metrics.json", label: "METR" },
    "/api/collections": { color: "text-amber-400",  dot: "bg-amber-400",  short: "/collections ", label: "COLL" },
  "/api/debug":       { color: "text-pink-400",   dot: "bg-pink-400",   short: "/debug       ", label: "DBUG" },
}

export const TERMINAL_HEADER_H = 34
export const TERMINAL_BODY_H   = 224

interface TerminalPanelProps {
  entries: LogEntry[]
  active?: Record<string, boolean>
}

export function TerminalPanel({ entries, active = {} }: TerminalPanelProps) {
  const { open, autoScroll, toggleOpen, toggleAutoScroll } = useTerminalStore()

  const colors   = useSettingsStore((s) => s.colors)
  const amberCls = AMBER_CLASSES[colors.amber]
  const redCls   = RED_CLASSES[colors.red]

  const statusColor = (status: number, error?: string) => {
    if (error || status === 0 || status >= 500) return redCls.latText
    if (status >= 400) return amberCls.latText
    return "text-green-500"
  }
  const latColor = (ms: number) => {
    if (ms > 500) return redCls.latText
    if (ms > 100) return amberCls.latText
    return "text-zinc-600"
  }
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [entries, autoScroll, open])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 select-none">
      {/* ── Header bar ── */}
      <div className="flex items-center bg-zinc-900 border-t border-zinc-700/80 px-3 h-[34px] gap-3">

        {/* Toggle */}
        <button
          onClick={toggleOpen}
          className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
          title={open ? "Collapse terminal" : "Expand terminal"}
        >
          <Terminal size={11} className="text-zinc-500" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Terminal</span>
          <motion.span
            animate={{ rotate: open ? 0 : 180 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex items-center ml-0.5"
          >
            <ChevronDown size={12} className="text-zinc-600" />
          </motion.span>
        </button>

        <span className="w-px h-4 bg-zinc-700/60 shrink-0" />

        {/* Endpoint pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {Object.entries(EP).map(([path, info]) => {
            const isActive  = active[path] ?? false
            const hasEntries = entries.some((e) => e.endpoint === path)
            if (!hasEntries && !isActive) return null
            return (
              <div
                key={path}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium",
                  "border border-zinc-800 transition-all duration-150",
                  isActive ? "bg-zinc-800" : "bg-transparent"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", info.dot, isActive ? "animate-pulse" : "opacity-40")} />
                <span className={cn(info.color, "opacity-80")}>{info.label}</span>
              </div>
            )
          })}
        </div>

        {/* Right: count + auto-scroll toggle */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-zinc-400 tabular-nums">{entries.length} lines</span>
          <button
            onClick={toggleAutoScroll}
            title={autoScroll ? "Auto-scroll on" : "Auto-scroll off"}
            className={cn(
              "flex items-center justify-center w-5 h-5 transition-colors duration-150",
              autoScroll ? "text-green-500 hover:text-green-400" : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            <ArrowDownToLine size={11} />
          </button>
        </div>
      </div>

      {/* ── Log body — animated with framer-motion ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="terminal-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: TERMINAL_BODY_H, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="bg-zinc-950 border-t border-zinc-800/50 overflow-hidden"
          >
            <div className="h-full overflow-y-auto font-mono text-[10px] leading-[1.65] px-4 py-2">
              {entries.length === 0 && (
                <span className="text-zinc-400">_ awaiting requests...</span>
              )}
              {entries.map((e) => {
                const info   = EP[e.endpoint]
                const sColor = statusColor(e.status, e.error)
                const lColor = latColor(e.latencyMs)
                const time   = e.ts.toLocaleTimeString("en-GB", { hour12: false })
                return (
                  <div
                    key={e.id}
                    className="flex gap-2 whitespace-nowrap hover:bg-zinc-800/20 px-1 -mx-1"
                  >
                    <span className="text-zinc-400 tabular-nums shrink-0">{time}</span>
                    <span className="text-zinc-600 shrink-0">GET</span>
                    <span className={cn("shrink-0", info?.color ?? "text-zinc-400")}>
                      {info?.short ?? e.endpoint}
                    </span>
                    <span className={cn("tabular-nums shrink-0 w-7 text-right", sColor)}>
                      {e.error ? "ERR" : e.status}
                    </span>
                    <span className={cn("tabular-nums shrink-0", lColor)}>{e.latencyMs}ms</span>
                    {e.error && <span className="text-red-500/60 truncate">{e.error}</span>}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
