"use client"

import { cn } from "@/lib/utils"
import type { DebugResponse } from "@/lib/types"
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore"

interface PeerStatusStripProps { debug: DebugResponse | undefined }

export function PeerStatusStrip({ debug }: PeerStatusStripProps) {
  const colors   = useSettingsStore((s) => s.colors)
  const amberCls = AMBER_CLASSES[colors.amber]
  const redCls   = RED_CLASSES[colors.red]

  const stateClasses = (state: string) => {
    const s = state.toLowerCase()
    if (s === "leader")   return "text-green-400 bg-green-400/10 border-green-500/30"
    if (s === "follower") return "text-zinc-400 bg-zinc-800/60 border-zinc-700"
    return amberCls.stateEntry
  }
  const badgeClasses = (state: string) => {
    const s = state.toLowerCase()
    if (s === "leader")   return "text-green-300 border-green-500/40 bg-green-500/10"
    if (s === "follower") return "text-zinc-500 border-zinc-600 bg-zinc-800"
    return amberCls.stateBadge
  }
  const contactColor = (ms: number) => {
    if (ms > 1000) return redCls.latText
    if (ms > 200)  return amberCls.latText
    return "text-zinc-600"
  }
  if (!debug?.peers) return null
  const peers = Object.entries(debug.peers)
  if (peers.length === 0) return null

  return (
    <div className="px-6 py-2 border-b border-zinc-800/60 bg-zinc-950/80">
      <div className="max-w-[1800px] mx-auto flex items-center gap-2 flex-wrap">
        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 shrink-0 mr-1">Cluster</span>
        {peers.map(([addr, peer]) => (
          <div
            key={addr}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 border text-[10px] font-mono rounded-sm",
              stateClasses(peer.state),
            )}
          >
            <span className="truncate max-w-[200px]">{addr}</span>
            <span className={cn(
              "text-[8px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm font-bold shrink-0",
              badgeClasses(peer.state),
            )}>
              {peer.state.toUpperCase()}
            </span>
            <span className={cn("tabular-nums shrink-0 text-[9px]", contactColor(peer.last_contact_ms))}>
              {peer.last_contact_ms}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
