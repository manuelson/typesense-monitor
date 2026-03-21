"use client";

import { cn } from "@/lib/utils";
import type { AlertLevel } from "@/lib/types";
import {
  useSettingsStore,
  AMBER_CLASSES,
  RED_CLASSES,
} from "@/store/settingsStore";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function Tile({
  label,
  value,
  unit,
  sub,
  level = "green",
  hint,
  source,
  large = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  level?: AlertLevel;
  hint?: string;
  source?: string;
  large?: boolean;
}) {
  const colors = useSettingsStore((s) => s.colors);
  const amberCls = AMBER_CLASSES[colors.amber];
  const redCls = RED_CLASSES[colors.red];

  const bar =
    level === "red"
      ? redCls.dot
      : level === "amber"
        ? amberCls.dot
        : "bg-zinc-700";
  const val =
    level === "red"
      ? redCls.text
      : level === "amber"
        ? amberCls.text
        : "text-zinc-100";

  return (
    <div className="relative bg-zinc-900 border border-zinc-800 flex flex-col p-3 gap-1">
      {/* top accent bar */}
      <div className={cn("absolute top-0 inset-x-0 h-[2px]", bar)} />

      {/* value */}
      <p
        className={cn(
          "tabular-nums font-bold leading-none",
          large ? "text-3xl" : "text-lg",
          val,
        )}
      >
        {value}
        {unit && (
          <span className="text-[11px] font-normal text-zinc-500 ml-1">
            {unit}
          </span>
        )}
      </p>

      {/* label + tooltip trigger */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 truncate">
          {label}
        </span>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors leading-none">
                <Info size={10} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-60 flex flex-col gap-1.5 p-3 bg-zinc-900 border border-zinc-800"
            >
              <p className="text-xs leading-snug">{hint}</p>
              {source && (
                <p className="text-[10px] font-mono text-muted-foreground border-t border-border pt-1.5 break-all">
                  {source}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* sublabel */}
      {sub && <p className="text-[9px] text-zinc-400 truncate">{sub}</p>}
    </div>
  );
}
