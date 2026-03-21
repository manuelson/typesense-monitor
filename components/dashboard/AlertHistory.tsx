"use client";

import { X, Trash2 } from "lucide-react";
import { useAlertHistoryStore } from "@/store/alertHistoryStore";
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard";
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore";
import { cn } from "@/lib/utils";

export function AlertHistory() {
  const { entries, remove, clear } = useAlertHistoryStore();
  const colors   = useSettingsStore((s) => s.colors);
  const amberCls = AMBER_CLASSES[colors.amber];
  const redCls   = RED_CLASSES[colors.red];

  const sorted = [...entries].reverse(); // newest first

  function levelEntry(level: string): string {
    if (level === "red")   return redCls.entry;
    if (level === "amber") return amberCls.entry;
    return "text-green-400 border-green-500/20 bg-green-500/5";
  }

  const badge = (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-400 tabular-nums">
        {entries.length} entries
      </span>
      {entries.length > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); clear(); }}
          className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-red-400 transition-colors"
          title="Clear all"
        >
          <Trash2 size={10} />
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <CollapsibleCard title="Alert History" right={badge} collapsible={false}>
      <div className="px-4 pb-4 max-h-64 overflow-y-auto space-y-1 scrollbar-none">
        {sorted.length === 0 ? (
          <p className="flex items-center justify-center text-zinc-400 text-[11px] py-6">
            No alerts recorded
          </p>
        ) : (
          sorted.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 px-2.5 py-1.5 border text-[10px] rounded-sm group",
                levelEntry(entry.level),
              )}
            >
              <span className="text-zinc-400 tabular-nums shrink-0 font-mono text-[9px]">
                {new Date(entry.ts).toLocaleTimeString()}
              </span>
              <span className="flex-1">{entry.message}</span>
              <button
                onClick={() => remove(entry.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400"
                title="Delete"
              >
                <X size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </CollapsibleCard>
  );
}
