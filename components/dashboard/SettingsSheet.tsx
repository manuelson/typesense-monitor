"use client";

import { RotateCcw, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useSettingsStore,
  POLLING_DEFAULTS,
  THRESHOLDS_DEFAULTS,
  COLORS_DEFAULTS,
  AMBER_CLASSES,
  RED_CLASSES,
  type AmberColor,
  type RedColor,
  type PollingConfig,
} from "@/store/settingsStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

function msToSeconds(ms: number) {
  return ms / 1000;
}
function secondsToMs(s: number) {
  return Math.round(s) * 1000;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  onReset,
}: {
  title: string;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">
        {title}
      </span>
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors"
        title="Reset to defaults"
      >
        <RotateCcw size={10} />
        Reset
      </button>
    </div>
  );
}

// Polling row: label + slider (1s–60s) + numeric readout
function PollingRow({
  label,
  endpoint,
  defaultMs,
}: {
  label: string;
  endpoint: keyof PollingConfig;
  defaultMs: number;
}) {
  const value = useSettingsStore((s) => s.polling[endpoint]);
  const setPolling = useSettingsStore((s) => s.setPolling);
  const seconds = msToSeconds(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-zinc-400 font-mono">{label}</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1}
            max={60}
            value={seconds}
            onChange={(e) => {
              const v = Math.max(1, Math.min(60, Number(e.target.value)));
              setPolling(endpoint, secondsToMs(v));
            }}
            className="h-6 w-14 text-[11px] text-center font-mono bg-zinc-900 border-zinc-700 text-zinc-300 px-1"
          />
          <span className="text-[10px] text-zinc-600">s</span>
          {value !== defaultMs && (
            <span className="text-[9px] text-amber-500">●</span>
          )}
        </div>
      </div>
      <Slider
        min={1}
        max={60}
        step={1}
        value={[seconds]}
        onValueChange={([v]) => setPolling(endpoint, secondsToMs(v))}
        className="[&_[role=slider]]:size-3"
      />
      <div className="flex justify-between text-[9px] text-zinc-400">
        <span>1s</span>
        <span className="text-zinc-600">default {msToSeconds(defaultMs)}s</span>
        <span>60s</span>
      </div>
    </div>
  );
}

// Dual-threshold row: amber + red sliders
function ThresholdRow({
  label,
  metric,
  unit,
  min,
  max,
  step,
}: {
  label: string;
  metric: "cpu" | "memory" | "latency" | "disk" | "endpointLatency";
  unit: string;
  min: number;
  max: number;
  step: number;
}) {
  const thresholds = useSettingsStore((s) => s.thresholds[metric]) as {
    amber: number;
    red: number;
  };
  const setThreshold = useSettingsStore((s) => s.setThreshold);
  const colors = useSettingsStore((s) => s.colors);
  const amberCls = AMBER_CLASSES[colors.amber];
  const redCls = RED_CLASSES[colors.red];
  const defaults = THRESHOLDS_DEFAULTS[metric] as {
    amber: number;
    red: number;
  };

  function handleChange(vals: number[]) {
    const [a, r] = vals;
    if (a < r) {
      setThreshold(metric, "amber", a);
      setThreshold(metric, "red", r);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-zinc-400 font-mono">{label}</Label>
        <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums">
          <span className={amberCls.text}>
            {thresholds.amber}
            {unit}
          </span>
          <span className="text-zinc-400">/</span>
          <span className={redCls.text}>
            {thresholds.red}
            {unit}
          </span>
          {(thresholds.amber !== defaults.amber ||
            thresholds.red !== defaults.red) && (
            <span className="text-amber-500">●</span>
          )}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[thresholds.amber, thresholds.red]}
        onValueChange={handleChange}
        className="[&_[role=slider]]:size-3"
      />
      <div className="flex justify-between text-[9px] text-zinc-400">
        <span>
          {min}
          {unit}
        </span>
        <span className="flex gap-3">
          <span>
            <span className={cn("mr-0.5", amberCls.text)}>▲</span>
            warn {defaults.amber}
            {unit}
          </span>
          <span>
            <span className={cn("mr-0.5", redCls.text)}>▲</span>
            crit {defaults.red}
            {unit}
          </span>
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

// Single threshold row (pending writes — amber only)
function SingleThresholdRow() {
  const value = useSettingsStore((s) => s.thresholds.pendingWrites);
  const setThreshold = useSettingsStore((s) => s.setThreshold);
  const colors = useSettingsStore((s) => s.colors);
  const amberCls = AMBER_CLASSES[colors.amber];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-zinc-400 font-mono">
          Pending writes
        </Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1}
            max={500}
            value={value}
            onChange={(e) => {
              const v = Math.max(1, Math.min(500, Number(e.target.value)));
              setThreshold("pendingWrites", "value", v);
            }}
            className="h-6 w-14 text-[11px] text-center font-mono bg-zinc-900 border-zinc-700 text-zinc-300 px-1"
          />
          <span className="text-[10px] text-zinc-600">batches</span>
          {value !== THRESHOLDS_DEFAULTS.pendingWrites && (
            <span className="text-amber-500 text-[9px]">●</span>
          )}
        </div>
      </div>
      <Slider
        min={1}
        max={100}
        step={1}
        value={[value]}
        onValueChange={([v]) => setThreshold("pendingWrites", "value", v)}
        className="[&_[role=slider]]:size-3"
      />
      <p className="text-[9px] text-zinc-400">
        <span className={cn("mr-0.5", amberCls.text)}>▲</span>
        warn above {THRESHOLDS_DEFAULTS.pendingWrites} (default)
      </p>
    </div>
  );
}

// Color swatch picker
function ColorPicker() {
  const colors = useSettingsStore((s) => s.colors);
  const setColor = useSettingsStore((s) => s.setColor);
  const resetColors = useSettingsStore((s) => s.resetColors);

  const amberOptions: AmberColor[] = ["amber", "yellow", "orange"];
  const redOptions: RedColor[] = ["red", "rose", "pink"];

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Alert colors" onReset={resetColors} />

      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            Warning level
          </Label>
          <div className="flex gap-2">
            {amberOptions.map((c) => {
              const cls = AMBER_CLASSES[c];
              return (
                <button
                  key={c}
                  onClick={() => setColor("amber", c)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border transition-all",
                    colors.amber === c
                      ? cn(cls.text, cls.border, "bg-zinc-800")
                      : "text-zinc-600 border-zinc-800 hover:border-zinc-600",
                  )}
                >
                  <span
                    className={cn("inline-block size-2 rounded-full", cls.dot)}
                  />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            Critical level
          </Label>
          <div className="flex gap-2">
            {redOptions.map((c) => {
              const cls = RED_CLASSES[c];
              return (
                <button
                  key={c}
                  onClick={() => setColor("red", c)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border transition-all",
                    colors.red === c
                      ? cn(cls.text, cls.border, "bg-zinc-800")
                      : "text-zinc-600 border-zinc-800 hover:border-zinc-600",
                  )}
                >
                  <span
                    className={cn("inline-block size-2 rounded-full", cls.dot)}
                  />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 border text-[10px] font-mono",
            AMBER_CLASSES[colors.amber].bg,
            AMBER_CLASSES[colors.amber].border,
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              AMBER_CLASSES[colors.amber].dot,
            )}
          />
          <span className={AMBER_CLASSES[colors.amber].text}>
            DEGRADED — CPU high: 75%
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 border text-[10px] font-mono",
            RED_CLASSES[colors.red].bg,
            RED_CLASSES[colors.red].border,
          )}
        >
          <span
            className={cn("size-2 rounded-full", RED_CLASSES[colors.red].dot)}
          />
          <span className={RED_CLASSES[colors.red].text}>
            CRITICAL — Memory critical: 97%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsSheet() {
  const resetPolling = useSettingsStore((s) => s.resetPolling);
  const resetThresholds = useSettingsStore((s) => s.resetThresholds);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-zinc-400 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings size={14} />
          <span className="hidden sm:inline uppercase tracking-widest">
            Config
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[400px] bg-zinc-950 border-zinc-800 p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 shrink-0">
          <SheetTitle className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">
            Configuration
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="polling" className="flex flex-col flex-1 min-h-0">
          <TabsList className="shrink-0 px-6 rounded-none bg-transparent border-b border-zinc-800 justify-start gap-4 h-10">
            <TabsTrigger
              value="polling"
              className="text-[10px] uppercase tracking-widest pb-2.5 data-[state=active]:text-green-400"
            >
              Polling
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="text-[10px] uppercase tracking-widest pb-2.5 data-[state=active]:text-green-400"
            >
              Alerts
            </TabsTrigger>
            <TabsTrigger
              value="colors"
              className="text-[10px] uppercase tracking-widest pb-2.5 data-[state=active]:text-green-400"
            >
              Colors
            </TabsTrigger>
          </TabsList>

          {/* ── Polling ── */}
          <TabsContent value="polling" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5 flex flex-col gap-6">
                <SectionHeader
                  title="Refresh intervals"
                  onReset={resetPolling}
                />

                <PollingRow
                  label="/api/health"
                  endpoint="health"
                  defaultMs={POLLING_DEFAULTS.health}
                />
                <Separator className="bg-zinc-800" />
                <PollingRow
                  label="/api/stats"
                  endpoint="stats"
                  defaultMs={POLLING_DEFAULTS.stats}
                />
                <Separator className="bg-zinc-800" />
                <PollingRow
                  label="/api/metrics"
                  endpoint="metrics"
                  defaultMs={POLLING_DEFAULTS.metrics}
                />
                <Separator className="bg-zinc-800" />
                <PollingRow
                  label="/api/collections"
                  endpoint="collections"
                  defaultMs={POLLING_DEFAULTS.collections}
                />
                <Separator className="bg-zinc-800" />
                <PollingRow
                  label="/api/debug"
                  endpoint="debug"
                  defaultMs={POLLING_DEFAULTS.debug}
                />

                <p className="text-[9px] text-zinc-400 leading-relaxed">
                  Changes apply immediately on the next polling cycle. Lower
                  intervals increase API load on your Typesense node.
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Alerts ── */}
          <TabsContent value="alerts" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5 flex flex-col gap-6">
                <SectionHeader
                  title="Alert thresholds"
                  onReset={resetThresholds}
                />

                <ThresholdRow
                  label="CPU usage"
                  metric="cpu"
                  unit="%"
                  min={0}
                  max={100}
                  step={1}
                />
                <Separator className="bg-zinc-800" />
                <ThresholdRow
                  label="Memory usage"
                  metric="memory"
                  unit="%"
                  min={0}
                  max={100}
                  step={1}
                />
                <Separator className="bg-zinc-800" />
                <ThresholdRow
                  label="Search latency"
                  metric="latency"
                  unit="ms"
                  min={0}
                  max={2000}
                  step={10}
                />
                <Separator className="bg-zinc-800" />
                <ThresholdRow
                  label="Disk usage"
                  metric="disk"
                  unit="%"
                  min={0}
                  max={100}
                  step={1}
                />
                <Separator className="bg-zinc-800" />
                <ThresholdRow
                  label="Endpoint latency"
                  metric="endpointLatency"
                  unit="ms"
                  min={100}
                  max={30000}
                  step={100}
                />
                <Separator className="bg-zinc-800" />
                <SingleThresholdRow />

                <p className="text-[9px] text-zinc-400 leading-relaxed">
                  Left thumb = warning (amber), right thumb = critical (red).
                  Drag to adjust. Changes take effect on the next data cycle.
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Colors ── */}
          <TabsContent value="colors" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-5">
                <ColorPicker />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
