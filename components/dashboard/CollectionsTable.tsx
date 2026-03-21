"use client"

import React, { useState } from "react"
import { ChevronRight } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard"
import { cn } from "@/lib/utils"
import type { Collection, CollectionField } from "@/lib/types"

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString()
}

function FieldTypeTag({ type }: { type: string }) {
  const color =
    type.startsWith("string")  ? "text-green-400  border-green-500/30 bg-green-500/5" :
    type.startsWith("int")     ? "text-blue-400   border-blue-500/30  bg-blue-500/5"  :
    type.startsWith("float")   ? "text-purple-400 border-purple-500/30 bg-purple-500/5" :
    type === "bool"            ? "text-amber-400  border-amber-500/30 bg-amber-500/5"  :
    "text-zinc-500 border-zinc-700 bg-zinc-800"
  return (
    <span className={cn("text-[8px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm font-mono shrink-0", color)}>
      {type}
    </span>
  )
}

function FieldBadge({ label, active }: { label: string; active?: boolean }) {
  if (!active) return null
  return (
    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 border border-zinc-700 bg-zinc-800 text-zinc-500 rounded-sm">
      {label}
    </span>
  )
}

function FieldSchemaRow({ fields }: { fields: CollectionField[] }) {
  if (fields.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="pt-0 pb-3 px-4">
          <div className="pl-6 text-[10px] text-zinc-700">No fields</div>
        </td>
      </tr>
    )
  }
  return (
    <tr>
      <td colSpan={5} className="pt-0 pb-3 px-4">
        <div className="ml-0 border border-zinc-800/60 bg-zinc-950/50 overflow-x-auto">
          <table className="w-full min-w-[360px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="text-left text-[8px] uppercase tracking-widest text-zinc-700 font-normal h-6 pl-3 pr-2">Field</th>
                <th className="text-left text-[8px] uppercase tracking-widest text-zinc-700 font-normal h-6 pr-2">Type</th>
                <th className="text-left text-[8px] uppercase tracking-widest text-zinc-700 font-normal h-6 pr-2 whitespace-nowrap">Attributes</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.name} className="border-b border-zinc-800/30 last:border-0">
                  <td className="py-1.5 pl-3 pr-2 font-mono text-[10px] text-zinc-300">{f.name}</td>
                  <td className="py-1.5 pr-2">
                    <FieldTypeTag type={f.type} />
                  </td>
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <FieldBadge label="facet"    active={f.facet} />
                      <FieldBadge label="optional" active={f.optional} />
                      <FieldBadge label="index"    active={f.index} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

interface CollectionsTableProps { collections: Collection[] }

export function CollectionsTable({ collections }: CollectionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const totalDocs = collections.reduce((s, c) => s + (c.num_documents ?? 0), 0)
  const badge = (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-600 tabular-nums">{collections.length} collections</span>
      <span className="text-[9px] text-zinc-700">·</span>
      <span className="text-[9px] text-zinc-600 tabular-nums">{totalDocs.toLocaleString()} docs</span>
    </div>
  )

  function toggleRow(name: string) {
    setExpandedRow((prev) => (prev === name ? null : name))
  }

  return (
    <CollapsibleCard title="Collections" right={badge}>
      <div className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/60 hover:bg-transparent">
              <TableHead className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 pl-0 w-5" />
              <TableHead className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 pl-0">Name</TableHead>
              <TableHead className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 text-right">Docs</TableHead>
              <TableHead className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 text-right">Fields</TableHead>
              <TableHead className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 text-right">Shards</TableHead>
              <TableHead className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center text-zinc-700 text-xs py-6 pl-0">
                  NO COLLECTIONS FOUND
                </TableCell>
              </TableRow>
            ) : (
              collections.map((col) => {
                const isOpen = expandedRow === col.name
                const hasFields = (col.fields?.length ?? 0) > 0
                return (
                  <React.Fragment key={col.name}>
                    <TableRow
                      onClick={() => hasFields && toggleRow(col.name)}
                      className={cn(
                        "border-zinc-800/40 transition-colors",
                        hasFields ? "cursor-pointer hover:bg-zinc-800/30" : "hover:bg-zinc-800/20",
                        isOpen && "bg-zinc-800/20",
                      )}
                    >
                      <TableCell className="py-2 pl-0 pr-1 w-5">
                        {hasFields && (
                          <ChevronRight
                            size={11}
                            className={cn(
                              "text-zinc-600 transition-transform duration-200",
                              isOpen && "rotate-90 text-green-500",
                            )}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-green-400 font-medium py-2 pl-0">{col.name}</TableCell>
                      <TableCell className="text-xs text-zinc-300 tabular-nums text-right py-2">
                        {col.num_documents.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 tabular-nums text-right py-2">
                        {col.fields?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 tabular-nums text-right py-2">
                        {col.num_memory_shards ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 py-2">
                        {col.created_at ? fmtDate(col.created_at) : "—"}
                      </TableCell>
                    </TableRow>
                    {isOpen && <FieldSchemaRow fields={col.fields ?? []} />}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </CollapsibleCard>
  )
}
