import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTripStore } from '../store/tripStore'

// FMCSA grid constants
const GRID_HOURS = 24
const ROW_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty\n(Not Driving)']
const ROW_KEYS = ['off_duty', 'sleeper', 'driving', 'on_duty']
const STATUS_COLORS = {
  off_duty: '#4a5568',
  sleeper: '#7B61FF',
  driving: '#2EC4B6',
  on_duty: '#FFB703',
}

const PAPER_W = 780
const HEADER_H = 110
const ROW_H = 44
const GRID_H = ROW_H * 4
const GRID_Y = HEADER_H
const GRID_X = 90
const GRID_W = PAPER_W - GRID_X - 20
const TOTAL_H = HEADER_H + GRID_H + 160 // extra for remarks

function hourToX(hour) {
  return GRID_X + (hour / GRID_HOURS) * GRID_W
}

function ELDGrid({ log, animated }) {
  const [drawProgress, setDrawProgress] = useState(animated ? 0 : 1)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!animated) { setDrawProgress(1); return }
    setDrawProgress(0)
    let start = null
    const duration = 2800

    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setDrawProgress(p)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [log, animated])

  const now = new Date(log.date + 'T00:00:00Z')
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

  // Total timeline width in hours covered by drawProgress
  const hoursDrawn = drawProgress * 24

  return (
    <svg
      viewBox={`0 0 ${PAPER_W} ${TOTAL_H}`}
      className="eld-grid-svg"
      style={{ background: '#f5f0e8' }}
    >
      {/* Paper texture lines */}
      {Array.from({ length: Math.floor(TOTAL_H / 22) }).map((_, i) => (
        <line key={i} x1={0} y1={i * 22} x2={PAPER_W} y2={i * 22} stroke="#e0d5c5" strokeWidth="0.5" />
      ))}

      {/* === HEADER === */}
      <text x={20} y={22} fontFamily="Georgia, serif" fontSize="14" fontWeight="bold" fill="#1a1a1a">
        Driver's Daily Log (24 Hours)
      </text>

      {/* Date fields */}
      <text x={20} y={42} fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="#333">
        Date: {dateStr}
      </text>
      <text x={20} y={56} fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="#333">
        Total Miles Driving: {log.total_miles_driving}
      </text>

      {/* From/To */}
      <text x={20} y={72} fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="#333">
        From: {''} {/* filled by remarks */}
      </text>
      <text x={280} y={72} fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="#333">
        Name of Carrier: HaulSync Fleet
      </text>
      <text x={280} y={86} fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="#333">
        Main Office Address: Dallas, TX
      </text>

      {/* === GRID AREA === */}
      {/* Outer border */}
      <rect x={GRID_X} y={GRID_Y} width={GRID_W} height={GRID_H} fill="none" stroke="#888" strokeWidth="1.5" />

      {/* Row dividers */}
      {ROW_KEYS.map((_, i) => (
        <line
          key={i}
          x1={GRID_X} y1={GRID_Y + i * ROW_H}
          x2={GRID_X + GRID_W} y2={GRID_Y + i * ROW_H}
          stroke="#888" strokeWidth={i === 0 ? 1.5 : 0.8}
        />
      ))}

      {/* Row labels */}
      {ROW_LABELS.map((label, i) => (
        <text
          key={i}
          x={GRID_X - 6}
          y={GRID_Y + i * ROW_H + ROW_H / 2 + 4}
          textAnchor="end"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="7.5"
          fill="#333"
        >
          {i + 1}. {label.split('\n')[0]}
        </text>
      ))}
      {/* On Duty second line */}
      <text
        x={GRID_X - 6}
        y={GRID_Y + 3 * ROW_H + ROW_H / 2 + 12}
        textAnchor="end"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="7.5"
        fill="#333"
      >
        (not driving)
      </text>

      {/* Hour tick marks */}
      {Array.from({ length: 25 }).map((_, h) => {
        const x = hourToX(h)
        const isMajor = h % 1 === 0
        const isNoon = h === 12
        const isNight = h === 0 || h === 24
        return (
          <g key={h}>
            {/* Major tick */}
            <line x1={x} y1={GRID_Y} x2={x} y2={GRID_Y + GRID_H} stroke={isNoon || isNight ? '#555' : '#bbb'} strokeWidth={isNoon || isNight ? 1 : 0.5} />
            {/* Hour label */}
            {h < 24 && (
              <text
                x={x + GRID_W / 48}
                y={GRID_Y - 4}
                textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize="7"
                fill="#555"
              >
                {h === 0 ? 'Mid\nnite' : h === 12 ? 'Noon' : h < 12 ? h : h - 12}
              </text>
            )}
            {/* Sub-ticks (every 15 min) */}
            {[0.25, 0.5, 0.75].map(frac => {
              const sx = hourToX(h + frac)
              if (sx > GRID_X + GRID_W) return null
              return (
                <line
                  key={frac}
                  x1={sx} y1={GRID_Y}
                  x2={sx} y2={GRID_Y + GRID_H}
                  stroke="#ddd" strokeWidth="0.4"
                />
              )
            })}
          </g>
        )
      })}

      {/* === DUTY STATUS LINES (animated) === */}
      {log.grid.map((seg, idx) => {
        const rowIndex = ROW_KEYS.indexOf(seg.status)
        if (rowIndex === -1) return null

        const startH = seg.start_hour
        const endH = seg.end_hour

        // Clip to draw progress
        if (startH > hoursDrawn) return null
        const clippedEnd = Math.min(endH, hoursDrawn)

        const x1 = hourToX(startH)
        const x2 = hourToX(clippedEnd)
        const y = GRID_Y + rowIndex * ROW_H + ROW_H / 2

        return (
          <g key={idx}>
            {/* Filled band */}
            <rect
              x={x1}
              y={GRID_Y + rowIndex * ROW_H + 2}
              width={Math.max(0, x2 - x1)}
              height={ROW_H - 4}
              fill={STATUS_COLORS[seg.status] + '30'}
            />
            {/* Main status line */}
            <line
              x1={x1} y1={y}
              x2={x2} y2={y}
              stroke={STATUS_COLORS[seg.status]}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Vertical connector at start (drop from previous row) */}
            {idx > 0 && (
              (() => {
                const prevSeg = log.grid[idx - 1]
                const prevRow = ROW_KEYS.indexOf(prevSeg.status)
                if (prevRow === rowIndex) return null
                const prevY = GRID_Y + prevRow * ROW_H + ROW_H / 2
                return (
                  <line
                    x1={x1} y1={prevY}
                    x2={x1} y2={y}
                    stroke={STATUS_COLORS[seg.status]}
                    strokeWidth="1.5"
                    strokeDasharray="2,1"
                  />
                )
              })()
            )}
          </g>
        )
      })}

      {/* === TOTAL HOURS (right side) === */}
      <text x={GRID_X + GRID_W + 4} y={GRID_Y + 10} fontFamily="'IBM Plex Mono', monospace" fontSize="7" fill="#333" fontWeight="bold">
        Total
      </text>
      {ROW_KEYS.map((key, i) => (
        <text
          key={key}
          x={GRID_X + GRID_W + 4}
          y={GRID_Y + i * ROW_H + ROW_H / 2 + 4}
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="8"
          fill={STATUS_COLORS[key]}
          fontWeight="600"
        >
          {(log.totals[key] || 0).toFixed(1)}
        </text>
      ))}

      {/* === REMARKS === */}
      <text x={20} y={GRID_Y + GRID_H + 20} fontFamily="Georgia, serif" fontSize="10" fontWeight="bold" fill="#1a1a1a">
        Remarks:
      </text>
      <line x1={20} y1={GRID_Y + GRID_H + 35} x2={PAPER_W - 20} y2={GRID_Y + GRID_H + 35} stroke="#888" strokeWidth="0.5" />

      {/* === RECAP SECTION === */}
      <text x={20} y={GRID_Y + GRID_H + 65} fontFamily="Georgia, serif" fontSize="9" fontWeight="bold" fill="#1a1a1a">
        Recap:
      </text>
      <text x={20} y={GRID_Y + GRID_H + 78} fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="#333">
        A. Total on duty today: {((log.totals.on_duty || 0) + (log.totals.driving || 0)).toFixed(1)} hrs
      </text>
      <text x={20} y={GRID_Y + GRID_H + 90} fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="#333">
        B. Total hours available tomorrow (70 hr minus A): calculated by HOS engine
      </text>
      <text x={20} y={GRID_Y + GRID_H + 104} fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="#333">
        C. Total hours on duty last 7 days (including today): per cycle used
      </text>

      {/* Footer */}
      <text x={20} y={TOTAL_H - 8} fontFamily="Georgia, serif" fontSize="7" fill="#888">
        Use time standard of home terminal. This log was electronically generated by HaulSync.
      </text>
    </svg>
  )
}

export default function ELDViewer() {
  const { tripData, selectedELDDay, setSelectedELDDay } = useTripStore()

  if (!tripData || !tripData.eld_logs?.length) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)', opacity: 0.3 }}>📋</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>No Logs Generated</div>
        <div style={{ fontSize: '0.75rem', marginTop: 8, color: 'var(--color-text-dim)' }}>
          Generate a route to produce FMCSA driver daily logs
        </div>
      </div>
    )
  }

  const logs = tripData.eld_logs
  const currentLog = logs[selectedELDDay]

  // Export handlers
  const handleDownloadSVG = () => {
    const svgEl = document.querySelector('.eld-grid-svg')
    if (!svgEl) return
    const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `HaulSync_ELD_Day${selectedELDDay + 1}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(tripData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'HaulSync_Trip.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <div>
          <div className="section-label">Driver Daily Logs</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
            FMCSA-compliant • {logs.length} day{logs.length > 1 ? 's' : ''}
          </div>
        </div>
        <div className="export-buttons" style={{ flex: 'unset' }}>
          <button className="btn-export" onClick={handleDownloadSVG} title="Download SVG">⬇ Log</button>
          <button className="btn-export" onClick={handleExportJSON} title="Export JSON">{ } JSON</button>
          <button className="btn-export" onClick={handlePrint} title="Print">🖨</button>
        </div>
      </div>

      <div className="eld-viewer">
        {/* Day Tabs */}
        <div className="eld-tabs">
          {logs.map((log, i) => (
            <button
              key={i}
              className={`eld-tab ${selectedELDDay === i ? 'active' : ''}`}
              onClick={() => setSelectedELDDay(i)}
            >
              Day {log.day} · {log.date}
            </button>
          ))}
        </div>

        {/* Log Content */}
        <div className="eld-log-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedELDDay}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Day header stats — wraps on mobile */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Driving',  value: `${(currentLog.totals.driving  || 0).toFixed(1)}h`, color: '#2EC4B6' },
                  { label: 'On Duty',  value: `${(currentLog.totals.on_duty  || 0).toFixed(1)}h`, color: '#FFB703' },
                  { label: 'Sleeper',  value: `${(currentLog.totals.sleeper  || 0).toFixed(1)}h`, color: '#7B61FF' },
                  { label: 'Off Duty', value: `${(currentLog.totals.off_duty || 0).toFixed(1)}h`, color: '#4a5568' },
                  { label: 'Miles',    value: `${currentLog.total_miles_driving}`,                 color: '#e8edf2' },
                ].map(s => (
                  <div key={s.label} style={{ flex: '1 1 80px', minWidth: 0, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: s.color, whiteSpace: 'nowrap' }}>{s.value}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* FMCSA grid — horizontally scrollable on mobile so document is never clipped */}
              <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', borderRadius: 8 }}>
                <div style={{ minWidth: 780 }}>
                  <div className="eld-paper">
                    <ELDGrid log={currentLog} animated={true} />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'Off Duty', color: '#4a5568' },
                  { label: 'Sleeper Berth', color: '#7B61FF' },
                  { label: 'Driving', color: '#2EC4B6' },
                  { label: 'On Duty', color: '#FFB703' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 3, background: l.color, borderRadius: 2 }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
