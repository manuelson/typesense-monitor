"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleCardProps {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  collapsible?: boolean   // false = always open, no toggle
  className?: string
  contentClass?: string
  stretch?: boolean
}

export function CollapsibleCard({
  title, right, children, defaultOpen = true, collapsible = true,
  className, contentClass, stretch,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = !collapsible || open

  return (
    <div className={cn(
      "border border-zinc-800 bg-zinc-900",
      stretch && "flex flex-col",
      className,
    )}>
      {/* Header */}
      {collapsible ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 group hover:bg-zinc-800/50 transition-colors duration-150 shrink-0"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn(
              "w-0.5 h-3.5 rounded-full transition-all duration-300",
              open ? "bg-green-500 opacity-100" : "bg-zinc-600 opacity-60"
            )} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 group-hover:text-zinc-400 transition-colors font-medium truncate">
              {title}
            </span>
            {right && <div className="flex items-center gap-2 ml-1">{right}</div>}
          </div>
          <ChevronDown
            size={14}
            className={cn(
              "shrink-0 ml-3 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
      ) : (
        <div className="w-full flex items-center justify-between px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-0.5 h-3.5 rounded-full bg-green-500 opacity-100" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium truncate">
              {title}
            </span>
            {right && <div className="flex items-center gap-2 ml-1">{right}</div>}
          </div>
        </div>
      )}

      {/* Body */}
      {stretch ? (
        <div className={cn(
          "transition-[opacity] duration-300",
          isOpen ? "flex-1 opacity-100" : "h-0 opacity-0 overflow-hidden",
          contentClass,
        )}>
          {children}
        </div>
      ) : (
        <div className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}>
          <div className={cn("overflow-hidden", contentClass)}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
