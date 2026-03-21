"use client";

import { X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert, AlertLevel } from "@/lib/types";
import {
  useSettingsStore,
  AMBER_CLASSES,
  RED_CLASSES,
} from "@/store/settingsStore";

interface HealthBannerProps {
  level: AlertLevel;
  alerts: Alert[];
  loading?: boolean;
  noData?: boolean;
  onDismiss?: (message: string) => void;
  onClearAll?: () => void;
}

export function HealthBanner({
  level,
  alerts,
  loading,
  noData,
  onDismiss,
  onClearAll,
}: HealthBannerProps) {
  const colors = useSettingsStore((s) => s.colors);
  const amberCls = AMBER_CLASSES[colors.amber];
  const redCls = RED_CLASSES[colors.red];

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <span className="animate-pulse text-zinc-600 text-[11px] tracking-widest uppercase">
          CONNECTING...
        </span>
      </div>
    );
  }

  if (noData) {
    return (
      <div className="flex items-center gap-3 px-6 py-3 bg-amber-950 border-b border-amber-900">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400">
          SYSTEMS DISCONNECTED
        </span>
        <span className="text-amber-900 shrink-0">|</span>
        <span className="text-[10px] text-amber-700 tracking-wide">
          Check <code className="font-mono text-amber-600">TYPESENSE_HOST</code>{" "}
          and{" "}
          <code className="font-mono text-amber-600">TYPESENSE_API_KEY</code>
        </span>
      </div>
    );
  }

  const bgColor =
    level === "red"
      ? cn(redCls.bg, redCls.border)
      : level === "amber"
        ? cn(amberCls.bg, amberCls.border)
        : "bg-green-950 border-green-900";

  const dotColor =
    level === "red"
      ? redCls.dot
      : level === "amber"
        ? amberCls.dot
        : "bg-green-400";

  const textColor =
    level === "red"
      ? redCls.text
      : level === "amber"
        ? amberCls.text
        : "text-green-400";

  const statusText = {
    green: "ALL SYSTEMS NOMINAL",
    amber: "DEGRADED PERFORMANCE",
    red: "CRITICAL ALERT",
  }[level];

  return (
    <div className={cn("flex items-center gap-4 px-6 py-3 border-b", bgColor)}>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full",
            dotColor,
            level === "green" && "animate-pulse",
          )}
        />
        <span
          className={cn(
            "text-[11px] font-bold tracking-widest uppercase",
            textColor,
          )}
        >
          {statusText}
        </span>
      </div>

      {alerts.length > 0 && (
        <>
          <span className="text-zinc-700 shrink-0">|</span>
          <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
            {alerts.map((alert) => (
              <span
                key={alert.message}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] tracking-wide whitespace-nowrap",
                  alert.level === "red" ? redCls.text : amberCls.text,
                )}
              >
                {alert.message}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.message)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title="Dismiss"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {onClearAll && alerts.length > 1 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-zinc-600 hover:text-zinc-400 transition-colors shrink-0 ml-auto"
              title="Clear all alerts"
            >
              <XCircle size={11} />
              Clear all
            </button>
          )}
        </>
      )}
    </div>
  );
}
