'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Point = { key: string; label: string; short: string; clicks: number; visitors: number }

const fmt = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

/** Clean axis maximum and ~4 ticks (0 / 5 / 10 / 15 ...). */
function niceTicks(max: number) {
  if (max <= 0) return [0, 1]
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let t = 0; t <= top + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100)
  return ticks
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Single-series area chart: clicks over time, crosshair + tooltip, arrow keys to step. */
export function ClicksChart({ data, height = 260 }: { data: Point[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { t: 16, r: 16, b: 28, l: 40 }
  const W = Math.max(width, 280)
  const H = height
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const ticks = useMemo(() => niceTicks(Math.max(0, ...data.map((d) => d.clicks))), [data])
  const top = ticks[ticks.length - 1] || 1
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / top) * ih

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.clicks).toFixed(1)}`).join('')
  const area = data.length ? `${line}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : ''

  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 90))))
  const peak = data.reduce((m, d, i) => (d.clicks > (data[m]?.clicks ?? -1) ? i : m), 0)

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = Math.round(((px - pad.l) / iw) * (data.length - 1))
    setHover(Math.min(data.length - 1, Math.max(0, i)))
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setHover((h) => Math.min(data.length - 1, (h ?? -1) + 1))
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? data.length) - 1))
    if (e.key === 'Escape') setHover(null)
  }
  const h = hover !== null ? data[hover] : null
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover) - 70, 0), W - 140) : 0

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 && (
        <svg
          width={W}
          height={H}
          role="img"
          aria-label={`Clicks over time. Peak ${data[peak]?.clicks ?? 0} on ${data[peak]?.label ?? ''}. Use arrow keys to read values.`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-black/45 text-[11px] tabular-nums">
                {fmt(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={d.key} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : x(i) > W - pad.r - 30 ? 'end' : 'middle'} className="fill-black/45 text-[11px]">
                {d.short}
              </text>
            ) : null,
          )}
          <path d={area} fill="#000" fillOpacity={0.08} />
          <path d={line} fill="none" stroke="#000" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.length > 0 && data[peak].clicks > 0 && hover === null && (
            <g>
              <circle cx={x(peak)} cy={y(data[peak].clicks)} r={6} fill="#fff" />
              <circle cx={x(peak)} cy={y(data[peak].clicks)} r={4} fill="#000" />
              <text
                x={x(peak)}
                y={y(data[peak].clicks) - 12}
                textAnchor={x(peak) > W - pad.r - 40 ? 'end' : x(peak) < pad.l + 40 ? 'start' : 'middle'}
                className="fill-black text-[11px] font-bold"
              >
                Peak {fmt(data[peak].clicks)}
              </text>
            </g>
          )}
          {h && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#000" strokeOpacity={0.35} strokeWidth={1} />
              <circle cx={x(hover)} cy={y(h.clicks)} r={6} fill="#fff" />
              <circle cx={x(hover)} cy={y(h.clicks)} r={4} fill="#000" />
            </g>
          )}
        </svg>
      )}
      {h && (
        <div className="pointer-events-none absolute top-0 z-10 w-[140px] border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_0_#000]" style={{ left: tipLeft }} role="status">
          <p className="text-lg font-black leading-none" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {h.clicks.toLocaleString()} <span className="text-xs font-bold text-black/50">clicks</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-black/70">{h.visitors.toLocaleString()} visitors</p>
          <p className="mt-0.5 text-[11px] text-black/45">{h.label}</p>
        </div>
      )}
    </div>
  )
}

// One-hue sequential ramp (more = darker), with neutral for zero.
const RAMP = ['#f0efed', '#eda332', '#c97e0e', '#9c5f05', '#6e4102', '#432701'] // validated ordinal ramp; [0] is the empty cell
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Weekday × hour heatmap of clicks. */
export function Heatmap({ heat, zone }: { heat: number[][]; zone: string }) {
  const max = Math.max(0, ...heat.flat())
  const [tip, setTip] = useState<{ d: number; h: number } | null>(null)
  const step = (v: number) => (v === 0 || max === 0 ? 0 : Math.min(5, 1 + Math.floor((v / max) * 4.999)))
  const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`
  return (
    <div>
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px]" role="grid" aria-label={`Clicks by weekday and hour (${zone})`}>
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center text-[10px] text-black/45 tabular-nums">
                {h % 3 === 0 ? h : ''}
              </span>
            ))}
            {heat.map((row, d) => (
              <div key={d} role="row" className="contents">
                <span className="text-[11px] font-bold text-black/55 self-center">{DAYS[d]}</span>
                {row.map((v, h) => (
                  <button
                    key={h}
                    type="button"
                    role="gridcell"
                    aria-label={`${DAYS[d]} ${hourLabel(h)}: ${v} clicks`}
                    onPointerEnter={() => setTip({ d, h })}
                    onPointerLeave={() => setTip(null)}
                    onFocus={() => setTip({ d, h })}
                    onBlur={() => setTip(null)}
                    className={`aspect-square rounded-[2px] outline-none transition-transform hover:scale-125 hover:ring-2 hover:ring-black focus-visible:ring-2 focus-visible:ring-black ${tip?.d === d && tip?.h === h ? 'ring-2 ring-black' : ''}`}
                    style={{ background: RAMP[step(v)] }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-black/55">
        <p className="min-h-[1.25rem] font-semibold text-black" aria-live="polite">
          {tip ? `${DAYS[tip.d]} ${hourLabel(tip.h)} – ${hourLabel((tip.h + 1) % 24)}: ${heat[tip.d][tip.h].toLocaleString()} clicks` : `Times in ${zone}`}
        </p>
        <div className="flex items-center gap-1.5">
          <span>Fewer</span>
          {RAMP.map((c) => (
            <span key={c} className="w-3.5 h-3.5 rounded-[2px]" style={{ background: c }} />
          ))}
          <span>More{max ? ` (max ${max})` : ''}</span>
        </div>
      </div>
    </div>
  )
}
