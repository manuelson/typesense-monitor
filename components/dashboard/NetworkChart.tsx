"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"
import { ChartCard } from "@/components/dashboard/ChartCard"
import type { TimePoint } from "@/lib/types"

interface DataPoint { t: number; rx?: number; tx?: number }

function mergeSeries(rx: TimePoint[], tx: TimePoint[]): DataPoint[] {
  const map = new Map<number, DataPoint>()
  for (const p of rx) map.set(p.t, { t: p.t, rx: p.v })
  for (const p of tx) {
    const ex = map.get(p.t)
    if (ex) ex.tx = p.v
    else map.set(p.t, { t: p.t, tx: p.v })
  }
  return Array.from(map.values()).sort((a, b) => a.t - b.t)
}

function NetTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-2xl min-w-[120px]">
      <p className="text-[10px] text-zinc-500 mb-1.5 tabular-nums">
        {new Date(label).toLocaleTimeString()}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: p.color }}>
            {(p.value as number)?.toFixed(1)}
            <span className="text-[9px] font-normal text-zinc-600 ml-0.5">KB/s</span>
          </span>
        </div>
      ))}
    </div>
  )
}

interface NetworkChartProps {
  rxData: TimePoint[]
  txData: TimePoint[]
  height?: number
  stretch?: boolean
  collapsible?: boolean
}

export function NetworkChart({ rxData, txData, height = 220, stretch, collapsible }: NetworkChartProps) {
  const data = mergeSeries(rxData, txData)
  const lastRx = rxData[rxData.length - 1]?.v
  const lastTx = txData[txData.length - 1]?.v

  const badge = (lastRx !== undefined || lastTx !== undefined) ? (
    <div className="flex items-center gap-2">
      {lastRx !== undefined && (
        <span className="text-[10px] tabular-nums text-blue-400 font-medium">↓{lastRx.toFixed(1)}</span>
      )}
      {lastTx !== undefined && (
        <span className="text-[10px] tabular-nums text-purple-400 font-medium">↑{lastTx.toFixed(1)}</span>
      )}
      <span className="text-[9px] text-zinc-700">KB/s</span>
    </div>
  ) : undefined

  return (
    <ChartCard title="Network I/O" right={badge} height={height} stretch={stretch} collapsible={collapsible}>
      <LineChart data={data} margin={{ top: 8, right: 4, bottom: 6, left: -4 }}>
        <defs>
          <filter id="netGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
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
          tickLine={false} axisLine={false} width={38}
          tickFormatter={(v) => `${v.toFixed(0)}K`}
        />
        <Tooltip
          content={<NetTooltip />}
          cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "3 3" }}
        />
        <Line
          type="monotone" dataKey="rx" name="RX"
          stroke="#3b82f6" strokeWidth={1.5} dot={false}
          activeDot={{ r: 3, fill: "#3b82f6", stroke: "#09090b", strokeWidth: 2 }}
          filter="url(#netGlow)" animationDuration={600}
        />
        <Line
          type="monotone" dataKey="tx" name="TX"
          stroke="#a855f7" strokeWidth={1.5} dot={false}
          activeDot={{ r: 3, fill: "#a855f7", stroke: "#09090b", strokeWidth: 2 }}
          animationDuration={600}
        />
      </LineChart>
    </ChartCard>
  )
}
