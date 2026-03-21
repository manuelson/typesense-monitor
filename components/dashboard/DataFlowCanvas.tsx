"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/settingsStore"
import type { PollingConfig } from "@/store/settingsStore"

type RGB = [number, number, number]

interface EndpointDef {
  id: string
  label: string
  path: string
  color: RGB
  angle: number
  desc: string
  interval: string
  fields: string
}

const ENDPOINTS: EndpointDef[] = [
  { id: "health",      label: "/health",       path: "/api/health",      color: [34, 197, 94],   angle: -90,  desc: "Cluster health check",                    interval: "every 5s",  fields: "ok: boolean" },
  { id: "stats",       label: "/stats.json",   path: "/api/stats",       color: [168, 85, 247],  angle: -18,  desc: "Request throughput & latency stats",       interval: "every 5s",  fields: "search/write QPS, latency, pending batches" },
  { id: "metrics",     label: "/metrics.json", path: "/api/metrics",     color: [59, 130, 246],  angle: 54,   desc: "System resource metrics (CPU/RAM/disk/net)", interval: "every 5s",  fields: "cpu, memory, disk, network bytes" },
  { id: "collections", label: "/collections",  path: "/api/collections", color: [245, 158, 11],  angle: 126,  desc: "Collection list with schema & doc counts",  interval: "every 10s", fields: "name, num_documents, fields[]" },
  { id: "debug",       label: "/debug",        path: "/api/debug",       color: [236, 72, 153],  angle: 198,  desc: "Cluster internals — version, Raft, peers",   interval: "every 30s", fields: "version, state, peers{}" },
]

interface Particle {
  ep: number; t: number; speed: number; r: number
  burst: boolean; bx: number; by: number; bt: number
}
interface AnimState {
  particles: Particle[]; frame: number; rotation: number
  pulseT: number; lastSpawn: number[]; burstFlash: number
}

// Pure geometry — exported so the hover handler can reuse them
function getCenter(W: number, H: number) { return { x: W * 0.5, y: H * 0.5 } }
function getNodeR(W: number, H: number) { return Math.min(W, H) * 0.36 }
function getNodePos(angle: number, W: number, H: number) {
  const R = getNodeR(W, H), c = getCenter(W, H)
  const rad = (angle * Math.PI) / 180
  return { x: c.x + R * Math.cos(rad), y: c.y + R * Math.sin(rad) }
}
function getNodeDotR(W: number, H: number) { return Math.max(7, Math.min(W, H) * 0.028) }
function getCenterR(W: number, H: number) { return Math.max(18, Math.min(W, H) * 0.072) }

function rgba([r, g, b]: RGB, a: number) { return `rgba(${r},${g},${b},${a})` }
function qbez(t: number, x0: number, y0: number, cpx: number, cpy: number, x1: number, y1: number) {
  const m = 1 - t
  return { x: m * m * x0 + 2 * m * t * cpx + t * t * x1, y: m * m * y0 + 2 * m * t * cpy + t * t * y1 }
}
function ctrlPt(sx: number, sy: number, cx: number, cy: number, curve: number) {
  const mx = (sx + cx) / 2, my = (sy + cy) / 2
  const dx = cx - sx, dy = cy - sy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { x: mx + (-dy / len) * curve, y: my + (dx / len) * curve }
}

interface HoverInfo {
  ep: EndpointDef | null  // null = center node
  x: number               // pixel offset within wrapper
  y: number
}

function fmtInterval(ms: number) {
  return ms % 1000 === 0 ? `every ${ms / 1000}s` : `every ${ms}ms`
}

export function DataFlowCanvas({ active = {} }: { active?: Record<string, boolean> }) {
  const polling     = useSettingsStore((s) => s.polling)
  const paused      = useSettingsStore((s) => s.paused)
  const togglePause = useSettingsStore((s) => s.togglePause)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const rafRef = useRef(0)
  const dimRef = useRef({ W: 0, H: 0 })

  const [hover, setHover] = useState<HoverInfo | null>(null)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { W, H } = dimRef.current
    if (!W || !H) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // Center node?
    const c   = getCenter(W, H)
    const cr  = getCenterR(W, H)
    if (Math.hypot(mx - c.x, my - c.y) <= cr * 1.5) {
      setHover({ ep: null, x: mx, y: my }); return
    }
    // Endpoint nodes?
    const ndR = getNodeDotR(W, H)
    for (const ep of ENDPOINTS) {
      const n = getNodePos(ep.angle, W, H)
      if (Math.hypot(mx - n.x, my - n.y) <= ndR * 2.8) {
        setHover({ ep, x: mx, y: my }); return
      }
    }
    setHover(null)
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const { W, H } = dimRef.current
    if (!W || !H) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const ndR = getNodeDotR(W, H)
    for (const ep of ENDPOINTS) {
      const n = getNodePos(ep.angle, W, H)
      if (Math.hypot(mx - n.x, my - n.y) <= ndR * 2.8) {
        togglePause(ep.id as keyof PollingConfig)
        return
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    let W = 0, H = 0

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      W = rect.width; H = rect.height
      dimRef.current = { W, H }
      canvas!.width = W * dpr; canvas!.height = H * dpr
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const ctx = canvas.getContext("2d")!
    const state: AnimState = {
      particles: [], frame: 0, rotation: 0, pulseT: 0,
      lastSpawn: ENDPOINTS.map(() => -999), burstFlash: 0,
    }

    function center() { return getCenter(W, H) }
    function nodeR()  { return getNodeR(W, H) }
    function nodePos(angle: number) { return getNodePos(angle, W, H) }
    function nodeDotR() { return getNodeDotR(W, H) }
    function centerR()  { return getCenterR(W, H) }

    function spawnParticle(epIdx: number) {
      state.particles.push({ ep: epIdx, t: 0, speed: 0.007 + Math.random() * 0.005, r: 2 + Math.random() * 1.5, burst: false, bx: 0, by: 0, bt: 0 })
    }

    function updateParticles() {
      state.frame++; state.rotation += 0.01; state.pulseT += 0.025; state.burstFlash *= 0.88
      for (let i = 0; i < ENDPOINTS.length; i++) {
        const ep = ENDPOINTS[i]
        const isPaused = pausedRef.current[ep.id as keyof typeof pausedRef.current] ?? false
        if (isPaused) { state.lastSpawn[i] = state.frame; continue }
        const isActive = activeRef.current[ep.path] ?? false
        const interval = isActive ? 10 : 18
        if (state.frame - state.lastSpawn[i] >= interval) { spawnParticle(i); state.lastSpawn[i] = state.frame }
      }
      // Remove in-flight particles for paused endpoints immediately
      state.particles = state.particles.filter(p => {
        const epId = ENDPOINTS[p.ep].id as keyof typeof pausedRef.current
        return !(pausedRef.current[epId] ?? false)
      })
      const dead: number[] = []
      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i]
        if (p.burst) { p.bt += 0.05; if (p.bt >= 1) dead.push(i); continue }
        p.t += p.speed * (0.35 + 2.0 * p.t * p.t)
        if (p.t >= 1) {
          state.burstFlash = Math.min(1, state.burstFlash + 0.4)
          const ang = Math.random() * Math.PI * 2
          for (let j = 0; j < 5; j++) {
            const a = ang + j * (Math.PI * 2 / 5) + Math.random() * 0.5
            state.particles.push({ ep: p.ep, t: 1, speed: 0, r: 1.2 + Math.random(), burst: true, bx: Math.cos(a), by: Math.sin(a), bt: 0 })
          }
          dead.push(i)
        }
      }
      for (let i = dead.length - 1; i >= 0; i--) state.particles.splice(dead[i], 1)
    }

    function glow(blur: number, color: string, fn: () => void) {
      ctx.shadowBlur = blur; ctx.shadowColor = color; fn(); ctx.shadowBlur = 0; ctx.shadowColor = "transparent"
    }

    function drawDotGrid() {
      const sp = 24; ctx.fillStyle = "rgba(39,39,42,0.3)"
      for (let x = sp / 2; x < W; x += sp)
        for (let y = sp / 2; y < H; y += sp) {
          ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill()
        }
    }

    function drawPaths() {
      const c = center(), curve = Math.min(W, H) * 0.06
      for (let i = 0; i < ENDPOINTS.length; i++) {
        const ep = ENDPOINTS[i], n = nodePos(ep.angle)
        const cp = ctrlPt(n.x, n.y, c.x, c.y, curve)
        const isActive = activeRef.current[ep.path] ?? false
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.quadraticCurveTo(cp.x, cp.y, c.x, c.y)
        ctx.strokeStyle = rgba(ep.color, isActive ? 0.22 : 0.09)
        ctx.lineWidth = isActive ? 1.2 : 0.6; ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([])
      }
    }

    function drawParticles() {
      const c = center(), curve = Math.min(W, H) * 0.06
      for (const p of state.particles) {
        const ep = ENDPOINTS[p.ep]
        if (p.burst) {
          const dist = p.bt * nodeDotR() * 1.8
          const px = c.x + p.bx * dist, py = c.y + p.by * dist
          const a = (1 - p.bt) * 0.7
          glow(6, rgba(ep.color, a), () => {
            ctx.beginPath(); ctx.arc(px, py, p.r * (1 - p.bt * 0.8), 0, Math.PI * 2)
            ctx.fillStyle = rgba(ep.color, a); ctx.fill()
          }); continue
        }
        const n = nodePos(ep.angle), cp = ctrlPt(n.x, n.y, c.x, c.y, curve)
        const pos = qbez(p.t, n.x, n.y, cp.x, cp.y, c.x, c.y)
        const dynR = p.r * (0.6 + 0.7 * p.t), alpha = 0.7 + 0.3 * p.t
        glow(10 + dynR * 3, rgba(ep.color, alpha * 0.9), () => {
          ctx.beginPath(); ctx.arc(pos.x, pos.y, dynR, 0, Math.PI * 2)
          ctx.fillStyle = rgba(ep.color, alpha); ctx.fill()
        })
      }
    }

    function drawNodes() {
      const c = center(), ndR = nodeDotR()
      for (let i = 0; i < ENDPOINTS.length; i++) {
        const ep = ENDPOINTS[i], n = nodePos(ep.angle)
        const isActive = activeRef.current[ep.path] ?? false
        const isPaused = pausedRef.current[ep.id as keyof typeof pausedRef.current] ?? false
        const dimmed = isPaused ? 0.3 : 1

        if (isActive && !isPaused) {
          const ripR = ndR * (1.6 + 0.6 * Math.sin(state.pulseT * 4 + i * 1.2))
          ctx.beginPath(); ctx.arc(n.x, n.y, ripR, 0, Math.PI * 2)
          ctx.strokeStyle = rgba(ep.color, 0.25); ctx.lineWidth = 1; ctx.stroke()
        }
        glow(isActive && !isPaused ? 14 : 5, rgba(ep.color, (isActive ? 0.8 : 0.45) * dimmed), () => {
          ctx.beginPath(); ctx.arc(n.x, n.y, ndR, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(9,9,11,0.92)"; ctx.fill()
          ctx.strokeStyle = rgba(ep.color, (isActive ? 1 : 0.65) * dimmed)
          ctx.lineWidth = isActive ? 1.8 : 1; ctx.stroke()
        })

        if (isPaused) {
          // Draw pause bars inside the node
          const bw = ndR * 0.22, bh = ndR * 0.55, gap = ndR * 0.18
          ctx.fillStyle = rgba(ep.color, 0.55)
          ctx.fillRect(n.x - gap - bw, n.y - bh / 2, bw, bh)
          ctx.fillRect(n.x + gap,      n.y - bh / 2, bw, bh)
        } else {
          ctx.beginPath(); ctx.arc(n.x, n.y, ndR * 0.25, 0, Math.PI * 2)
          ctx.fillStyle = rgba(ep.color, isActive ? 1 : 0.6); ctx.fill()
        }

        const labelAng = (ep.angle * Math.PI) / 180
        const lDist = ndR + Math.min(W, H) * 0.065
        const lx = n.x + Math.cos(labelAng) * lDist, ly = n.y + Math.sin(labelAng) * lDist
        const align = Math.abs(Math.cos(labelAng)) < 0.25 ? "center" : Math.cos(labelAng) > 0 ? "left" : "right"
        const fs = Math.max(9, Math.min(11, Math.min(W, H) * 0.025))
        ctx.font = `${fs}px ui-monospace,monospace`; ctx.textAlign = align as CanvasTextAlign
        ctx.textBaseline = "middle"; ctx.fillStyle = rgba(ep.color, (isActive ? 0.95 : 0.65) * dimmed)
        ctx.fillText(ep.label, lx, ly)

        if (isPaused) {
          ctx.font = `${fs * 0.85}px ui-monospace,monospace`
          ctx.fillStyle = rgba(ep.color, 0.45)
          const pauseLy = ly + fs * 1.4 * (Math.sin(labelAng) >= 0 ? 1 : -1)
          ctx.fillText("PAUSED", lx, pauseLy)
        }
      }
    }

    function drawCenter() {
      const c = center(), cr = centerR(), rot = state.rotation
      const haloR = cr * (2.0 + 0.25 * Math.sin(state.pulseT))
      ctx.beginPath(); ctx.arc(c.x, c.y, haloR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(34,197,94,${0.04 + 0.04 * Math.sin(state.pulseT)})`; ctx.lineWidth = 2; ctx.stroke()
      const haloR2 = cr * (1.65 + 0.2 * Math.cos(state.pulseT * 0.7))
      ctx.beginPath(); ctx.arc(c.x, c.y, haloR2, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(34,197,94,${0.07 + 0.05 * Math.cos(state.pulseT)})`; ctx.lineWidth = 1; ctx.stroke()
      if (state.burstFlash > 0.01) {
        const flR = cr * (1.1 + state.burstFlash * 0.5)
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, flR)
        grad.addColorStop(0, `rgba(34,197,94,${state.burstFlash * 0.35})`); grad.addColorStop(1, "rgba(34,197,94,0)")
        ctx.beginPath(); ctx.arc(c.x, c.y, flR, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
      }
      glow(18, "rgba(34,197,94,0.55)", () => {
        for (let i = 0; i < 8; i++) {
          const sa = rot + i * Math.PI / 4, ea = sa + Math.PI / 5.5
          ctx.beginPath(); ctx.arc(c.x, c.y, cr * 1.38, sa, ea)
          ctx.strokeStyle = `rgba(34,197,94,${0.5 + 0.3 * Math.sin(rot * 2.5 + i * 0.8)})`; ctx.lineWidth = 2; ctx.stroke()
        }
      })
      glow(8, "rgba(34,197,94,0.3)", () => {
        for (let i = 0; i < 6; i++) {
          const sa = -rot * 1.4 + i * Math.PI / 3, ea = sa + Math.PI / 4.5
          ctx.beginPath(); ctx.arc(c.x, c.y, cr * 0.78, sa, ea)
          ctx.strokeStyle = `rgba(34,197,94,${0.25 + 0.15 * Math.sin(-rot * 1.4 + i)})`; ctx.lineWidth = 1.2; ctx.stroke()
        }
      })
      glow(22, "rgba(34,197,94,0.65)", () => {
        ctx.beginPath(); ctx.arc(c.x, c.y, cr, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(9,9,11,0.96)"; ctx.fill()
        ctx.strokeStyle = "rgba(34,197,94,0.9)"; ctx.lineWidth = 1.8; ctx.stroke()
      })
      ctx.strokeStyle = "rgba(34,197,94,0.12)"; ctx.lineWidth = 0.8; ctx.setLineDash([2, 4])
      ctx.beginPath(); ctx.moveTo(c.x - cr * 0.7, c.y); ctx.lineTo(c.x + cr * 0.7, c.y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(c.x, c.y - cr * 0.7); ctx.lineTo(c.x, c.y + cr * 0.7); ctx.stroke()
      ctx.setLineDash([])
      const fs = Math.max(11, cr * 0.42)
      ctx.font = `bold ${fs}px ui-monospace,monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillStyle = "rgba(34,197,94,0.95)"; ctx.fillText("APP", c.x, c.y - fs * 0.32)
      ctx.font = `${fs * 0.6}px ui-monospace,monospace`; ctx.fillStyle = "rgba(82,82,91,0.85)"
      ctx.fillText("MONITOR", c.x, c.y + fs * 0.72)
    }

    function frame() {
      if (!W || !H) { rafRef.current = requestAnimationFrame(frame); return }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "rgba(9,9,11,0.38)"; ctx.fillRect(0, 0, W, H)
      drawDotGrid(); drawPaths(); updateParticles(); drawParticles(); drawNodes(); drawCenter()
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [])

  // Tooltip placement: flip to left if near right edge, flip up if near bottom
  const tipStyle = (x: number, y: number, wrapW: number, wrapH: number) => {
    const tipW = 220, tipH = 110
    return {
      left: x + 14 + tipW > wrapW ? x - tipW - 10 : x + 14,
      top:  y + tipH > wrapH      ? y - tipH       : y,
    }
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full h-full min-h-[420px] bg-zinc-950", hover?.ep && "cursor-pointer")}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHover(null)}
      onClick={onClick}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

        {/* ── Hover tooltip ── */}
        {hover && (() => {
          const wW = wrapRef.current?.clientWidth  ?? 400
          const wH = wrapRef.current?.clientHeight ?? 300
          const { left, top } = tipStyle(hover.x, hover.y, wW, wH)

          if (hover.ep === null) {
            // Center node
            const activeCount = ENDPOINTS.filter(ep => active[ep.path]).length
            return (
              <div className="absolute z-20 pointer-events-none w-[220px] bg-zinc-900/95 border border-zinc-700/70 shadow-2xl text-[10px] font-mono"
                style={{ left, top }}>
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-green-400 font-bold uppercase tracking-wider text-[10px]">Monitor App</span>
                </div>
                <div className="px-3 py-2 space-y-1 text-zinc-400">
                  <p>Aggregating data from <span className="text-zinc-200">{ENDPOINTS.length} endpoints</span></p>
                  <p className={cn(activeCount > 0 ? "text-green-400" : "text-zinc-600")}>
                    {activeCount} endpoint{activeCount !== 1 ? "s" : ""} polling now
                  </p>
                </div>
              </div>
            )
          }

          const ep = hover.ep
          const epKey = ep.id as keyof PollingConfig
          const isActive = active[ep.path] ?? false
          const isPaused = paused[epKey]
          const col = ep.color
          return (
            <div
              className="absolute z-20 pointer-events-none w-[220px] bg-zinc-900/95 border shadow-2xl text-[10px] font-mono"
              style={{ left, top, borderColor: rgba(col, 0.35) }}
            >
              <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: rgba(col, 0.2) }}>
                <span
                  className={cn("w-2 h-2 rounded-full shrink-0", isActive && !isPaused && "animate-pulse")}
                  style={{ backgroundColor: rgba(col, isPaused ? 0.3 : isActive ? 1 : 0.5) }}
                />
                <span className="font-bold tracking-wide" style={{ color: rgba(col, isPaused ? 0.5 : 0.95) }}>{ep.label}</span>
                <span className={cn("ml-auto text-[9px]", isPaused ? "text-zinc-600" : isActive ? "text-green-400" : "text-zinc-600")}>
                  {isPaused ? "PAUSED" : isActive ? "POLLING" : "IDLE"}
                </span>
              </div>
              <div className="px-3 py-2 space-y-1.5 text-zinc-400">
                <p className="text-zinc-300 leading-snug">{ep.desc}</p>
                <p><span className="text-zinc-600">Fields: </span>{ep.fields}</p>
                <p><span className="text-zinc-600">Refresh: </span>{fmtInterval(polling[epKey])}</p>
                <p><span className="text-zinc-600">Route: </span><span className="text-zinc-400">GET {ep.path.replace("/api", "")}</span></p>
                <p className="text-zinc-600 text-[9px]">{isPaused ? "Click node to resume" : "Click node to pause"}</p>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
