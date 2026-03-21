import { Skeleton } from "@/components/ui/skeleton";

function TileSkeleton({ large }: { large?: boolean }) {
  return (
    <div className="relative bg-zinc-900 border border-zinc-800 flex flex-col p-3 gap-1 h-full">
      {/* accent bar */}
      <Skeleton className="absolute top-0 inset-x-0 h-[2px] rounded-none bg-zinc-800" />
      {/* value */}
      <Skeleton
        className={
          large ? "h-9 w-16 mt-1 bg-zinc-800" : "h-6 w-12 mt-1 bg-zinc-800"
        }
      />
      {/* label */}
      <Skeleton className="h-2 w-20 bg-zinc-800/70" />
      {/* sub */}
      <Skeleton className="h-2 w-24 bg-zinc-800/50" />
    </div>
  );
}

function TileRow({ large }: { large?: boolean }) {
  return (
    <div className="overflow-x-auto scrollbar-none">
      <div className="grid grid-cols-5 gap-2 min-w-[560px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <TileSkeleton key={i} large={large} />
        ))}
      </div>
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b border-zinc-800/60">
        <Skeleton className="w-0.5 h-3.5 rounded-full bg-zinc-800" />
        <Skeleton className="h-2.5 w-24 bg-zinc-800" />
        <Skeleton className="h-2.5 w-10 ml-auto bg-zinc-800" />
      </div>
      <div className="flex-1 p-3 min-h-[160px]">
        <Skeleton className="w-full h-full bg-zinc-800/40 rounded-none" />
      </div>
    </div>
  );
}

function CollapsibleCardSkeleton({
  rows = 4,
  rowH = "h-8",
}: {
  rows?: number;
  rowH?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60">
        <Skeleton className="w-0.5 h-3.5 rounded-full bg-zinc-800" />
        <Skeleton className="h-2.5 w-32 bg-zinc-800" />
        <Skeleton className="h-2.5 w-10 ml-auto bg-zinc-800" />
      </div>
      <div className="px-4 py-3 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className={`${rowH} w-full bg-zinc-800/50 rounded-none`}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="px-4 py-4 max-w-[1800px] mx-auto space-y-3 w-full">
      {/* ── Metrics tiles ── */}
      <div className="space-y-2">
        <TileRow large />
        <TileRow />
      </div>

      {/* ── Hero: charts | dataflow | charts ── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-3 items-stretch"
        style={{ minHeight: 420 }}
      >
        <div className="grid grid-rows-2 gap-3 h-full">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <Skeleton className="min-h-[420px] bg-zinc-900/60 rounded-none" />
        <div className="grid grid-rows-2 gap-3 h-full">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>

      {/* ── Per-endpoint table ── */}
      <CollapsibleCardSkeleton rows={5} rowH="h-9" />

      {/* ── Network I/O + Alert History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCardSkeleton />
        <CollapsibleCardSkeleton rows={4} rowH="h-6" />
      </div>

      {/* ── Collections ── */}
      <CollapsibleCardSkeleton rows={3} rowH="h-10" />
    </main>
  );
}
