"use client"

import { useEffect } from "react"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-500">Dashboard error</p>
      <p className="text-zinc-300 text-center max-w-sm text-sm">
        {error.message ?? "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono text-zinc-400">digest: {error.digest}</p>
      )}
      <button
        onClick={() => unstable_retry()}
        className="mt-2 px-4 py-2 text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
