"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"
import { ChartCard } from "@/components/dashboard/ChartCard"
import type { TimePoint } from "@/lib/types"

function fmtBytes(b: number) {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)}GB`
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(0)}MB`
  return `${(b / 1024).toFixed(0)}KB`
}

function MemTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-2xl">
      <p className="text-[10px] text-zinc-500 mb-1 tabular-nums">{new Date(label).toLocaleTimeString()}</p>
      <p className="text-sm font-bold text-blue-400 tabular-nums">{fmtBytes(payload[0]?.value)}</p>
    </div>
  )
}

interface MemoryChartProps { data: TimePoint[]; totalBytes?: number; height?: number; stretch?: boolean; collapsible?: boolean }

export function MemoryChart({ data, totalBytes, height = 220, stretch, collapsible }: MemoryChartProps) {
  const current = data[data.length - 1]?.v
  const pct = current && totalBytes ? ((current / totalBytes) * 100).toFixed(0) : undefined
  const badge = pct !== undefined && (
    <span className="text-[10px] tabular-nums text-blue-400 font-medium">{pct}%</span>
  )

  return (
    <ChartCard title="Memory Used" right={badge} height={height} stretch={stretch} collapsible={collapsible}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 6, left: -4 }}>
        <defs>
          <linearGradient id="memGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.4}  />
            <stop offset="55%"  stopColor="#3b82f6" stopOpacity={0.1}  />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
          </linearGradient>
          <filter id="memGlow">
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
          domain={[0, totalBytes && totalBytes > 0 ? totalBytes : "auto"]}
          tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "ui-monospace" }}
          tickLine={false} axisLine={false} width={36}
          tickFormatter={(v) => fmtBytes(v)}
        />
        <Tooltip content={<MemTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Area
          type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2}
          fill="url(#memGrad2)" dot={false}
          activeDot={{ r: 4, fill: "#3b82f6", stroke: "#09090b", strokeWidth: 2 }}
          filter="url(#memGlow)"
          animationDuration={600}
        />
      </AreaChart>
    </ChartCard>
  )
}
