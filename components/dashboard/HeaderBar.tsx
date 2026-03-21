"use client"

import { SettingsSheet } from "@/components/dashboard/SettingsSheet"

interface HeaderBarProps {
  version?: string
  lastSync?: Date | null
  peerCount?: number
  raftState?: number
}

const RAFT_STATES: Record<number, string> = {
  0: "FOLLOWER",
  1: "CANDIDATE",
  2: "LEADER",
}

export function HeaderBar({ version, lastSync, peerCount, raftState }: HeaderBarProps) {
  const raftLabel = raftState !== undefined ? (RAFT_STATES[raftState] ?? "UNKNOWN") : null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <div className="flex items-center gap-3">
        <span className="text-green-400 font-bold text-lg tracking-widest">TYPESENSE</span>
        <span className="text-zinc-600 text-lg">//</span>
        <span className="text-zinc-400 text-sm tracking-widest uppercase">MONITOR</span>
        {version && (
          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-700">
            v{version}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-zinc-600">
        {raftLabel && (
          <span className={raftLabel === "LEADER" ? "text-green-500" : "text-zinc-500"}>
            {raftLabel}
          </span>
        )}
        {peerCount !== undefined && (
          <span>{peerCount} PEER{peerCount !== 1 ? "S" : ""}</span>
        )}
        {lastSync && (
          <span>
            SYNC{" "}
            <span className="text-zinc-400 tabular-nums">
              {lastSync.toLocaleTimeString()}
            </span>
          </span>
        )}
        <SettingsSheet />
      </div>
    </div>
  )
}
