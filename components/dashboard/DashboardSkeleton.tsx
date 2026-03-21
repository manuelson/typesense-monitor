import { Skeleton } from "@/components/ui/skeleton"

function TileRow({ large }: { large?: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-2 min-w-[560px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 p-3 flex flex-col gap-2">
          <Skeleton className="h-[2px] w-full -mt-3 -mx-3 mb-1 rounded-none bg-zinc-800" />
          <Skeleton className={`${large ? "h-8 w-16" : "h-5 w-12"} bg-zinc-800`} />
          <Skeleton className="h-2.5 w-20 bg-zinc-800/70" />
          {large && <Skeleton className="h-2 w-24 bg-zinc-800/50" />}
        </div>
      ))}
    </div>
  )
}

function ChartCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0">
        <Skeleton className="w-0.5 h-3.5 rounded-full bg-zinc-800" />
        <Skeleton className="h-2.5 w-24 bg-zinc-800" />
        <Skeleton className="h-2.5 w-10 ml-auto bg-zinc-800" />
      </div>
      <div className="flex-1 px-1 pt-1 min-h-[160px]">
        <Skeleton className="w-full h-full bg-zinc-800/40" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <main className="px-4 py-4 max-w-[1800px] mx-auto space-y-3">
      {/* Metrics */}
      <div className="space-y-2">
        <div className="overflow-x-auto scrollbar-none"><TileRow large /></div>
        <div className="overflow-x-auto scrollbar-none"><TileRow /></div>
      </div>

      {/* Hero: charts | dataflow | charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-3" style={{ minHeight: 420 }}>
        {/* Left charts */}
        <div className="grid grid-rows-2 gap-3 h-full">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        {/* Center canvas */}
        <Skeleton className="min-h-[420px] bg-zinc-900/80" />
        {/* Right charts */}
        <div className="grid grid-rows-2 gap-3 h-full">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>

      {/* Collections table */}
      <div className="bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="w-0.5 h-3.5 rounded-full bg-zinc-800" />
          <Skeleton className="h-2.5 w-28 bg-zinc-800" />
        </div>
        <div className="px-4 pb-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-zinc-800/50" />
          ))}
        </div>
      </div>
    </main>
  )
}
