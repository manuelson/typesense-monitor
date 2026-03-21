"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, CartesianGrid,
} from "recharts"
import { ChartCard } from "@/components/dashboard/ChartCard"
import type { TimePoint } from "@/lib/types"
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore"

interface LatencyChartProps { data: TimePoint[]; height?: number; stretch?: boolean; collapsible?: boolean }

export function LatencyChart({ data, height = 220, stretch, collapsible }: LatencyChartProps) {
  const colors   = useSettingsStore((s) => s.colors)
  const amberHex = AMBER_CLASSES[colors.amber].hex
  const redHex   = RED_CLASSES[colors.red].hex
  const amberText = AMBER_CLASSES[colors.amber].text

  const current = data[data.length - 1]?.v
  const badge = current !== undefined && (
    <span className={`text-[10px] tabular-nums font-medium ${amberText}`}>{current.toFixed(0)}ms</span>
  )

  const LatTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const v = payload[0]?.value as number
    return (
      <div className="bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-2xl">
        <p className="text-[10px] text-zinc-500 mb-1 tabular-nums">{new Date(label).toLocaleTimeString()}</p>
        <p className={`text-sm font-bold tabular-nums ${amberText}`}>{v?.toFixed(1)}<span className="text-xs font-normal text-zinc-500 ml-0.5">ms</span></p>
      </div>
    )
  }

  return (
    <ChartCard title="Search Latency" right={badge} height={height} stretch={stretch} collapsible={collapsible}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 6, left: -4 }}>
        <defs>
          <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={amberHex} stopOpacity={0.4}  />
            <stop offset="55%"  stopColor={amberHex} stopOpacity={0.08} />
            <stop offset="100%" stopColor={amberHex} stopOpacity={0}    />
          </linearGradient>
          <filter id="latGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="1 4" />
        <XAxis
          dataKey="t"
          tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "ui-monospace" }}
          tickLine={false} axisLine={false} minTickGap={60}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "ui-monospace" }}
          tickLine={false} axisLine={false} width={34}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip content={<LatTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "3 3" }} />
        <ReferenceLine y={100} stroke={amberHex} strokeWidth={0.8} strokeDasharray="4 3" strokeOpacity={0.4}
          label={{ value: "100ms", position: "insideTopRight", fontSize: 8, fill: amberHex, opacity: 0.55 }} />
        <ReferenceLine y={500} stroke={redHex} strokeWidth={0.8} strokeDasharray="4 3" strokeOpacity={0.4}
          label={{ value: "500ms", position: "insideTopRight", fontSize: 8, fill: redHex, opacity: 0.55 }} />
        <Area
          type="monotone" dataKey="v" stroke={amberHex} strokeWidth={2}
          fill="url(#latGrad)" dot={false}
          activeDot={{ r: 4, fill: amberHex, stroke: "#09090b", strokeWidth: 2 }}
          filter="url(#latGlow)"
          animationDuration={600}
        />
      </AreaChart>
    </ChartCard>
  )
}
