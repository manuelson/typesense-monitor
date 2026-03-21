"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { ChartCard } from "@/components/dashboard/ChartCard"
import type { TimePoint } from "@/lib/types"

function CpuTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value as number
  return (
    <div className="bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm">
      <p className="text-[10px] text-zinc-500 mb-1 tabular-nums">{new Date(label).toLocaleTimeString()}</p>
      <p className="text-sm font-bold text-green-400 tabular-nums">{v?.toFixed(1)}<span className="text-xs font-normal text-zinc-500 ml-0.5">%</span></p>
    </div>
  )
}

interface CpuChartProps { data: TimePoint[]; height?: number; stretch?: boolean; collapsible?: boolean }

export function CpuChart({ data, height = 220, stretch, collapsible }: CpuChartProps) {
  const current = data[data.length - 1]?.v
  const badge = current !== undefined && (
    <span className="text-[10px] tabular-nums text-green-500 font-medium">{current.toFixed(1)}%</span>
  )

  return (
    <ChartCard title="CPU Efficiency" right={badge} height={height} stretch={stretch} collapsible={collapsible}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 6, left: -8 }}>
        <defs>
          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.35} />
            <stop offset="60%"  stopColor="#22c55e" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0}    />
          </linearGradient>
          <filter id="cpuGlow">
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
          domain={[0, 100]} tickCount={5}
          tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "ui-monospace" }}
          tickLine={false} axisLine={false} width={26}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CpuTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "3 3" }} />
        <ReferenceLine y={70} stroke="#f59e0b" strokeWidth={0.8} strokeDasharray="4 3" strokeOpacity={0.5}
          label={{ value: "WARN", position: "insideTopRight", fontSize: 8, fill: "#f59e0b", opacity: 0.6 }} />
        <ReferenceLine y={90} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="4 3" strokeOpacity={0.5}
          label={{ value: "CRIT", position: "insideTopRight", fontSize: 8, fill: "#ef4444", opacity: 0.6 }} />
        <Area
          type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2}
          fill="url(#cpuGrad)" dot={false}
          activeDot={{ r: 4, fill: "#22c55e", stroke: "#09090b", strokeWidth: 2 }}
          filter="url(#cpuGlow)"
          animationDuration={600}
        />
      </AreaChart>
    </ChartCard>
  )
}
