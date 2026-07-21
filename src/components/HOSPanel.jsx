import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTripStore } from '../store/tripStore'

const TYPE_CONFIG = {
  current:  { color: 'var(--color-graphite)', bg: 'var(--color-bg-elevated)', icon: '📍' },
  pickup:   { color: 'var(--color-green)',    bg: 'var(--color-green-dim)',    icon: '📦' },
  dropoff:  { color: 'var(--color-green)',    bg: 'var(--color-green-dim)',    icon: '🏁' },
  drive:    { color: 'var(--color-teal)',     bg: 'var(--color-teal-dim)',     icon: '🚛' },
  fuel:     { color: 'var(--color-amber)',    bg: 'var(--color-amber-dim)',    icon: '⛽' },
  break:    { color: 'var(--color-amber)',    bg: 'var(--color-amber-dim)',    icon: '☕' },
  sleep:    { color: 'var(--color-purple)',   bg: 'var(--color-purple-dim)',   icon: '🌙' },
  on_duty:  { color: 'var(--color-teal)',     bg: 'var(--color-teal-dim)',     icon: '📋' },
}

function formatHours(h) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function formatTime(isoString) {
  if (!isoString) return '--'
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function HOSPanel() {
  const { tripData, setMapFlyTarget, activeTimelineIndex, setActiveTimelineIndex } = useTripStore()
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!tripData) {
    return (
      <div className="panel panel-right">
        <div className="panel-header">
          <div className="panel-title">HOS Monitor</div>
          <div className="panel-subtitle">Hours of Service Status</div>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
          <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>⏱</div>
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Awaiting Route</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textAlign: 'center' }}>
            Generate a route to see live HOS compliance data
          </div>
        </div>
      </div>
    )
  }

  const { hos, timeline, summary } = tripData

  const meters = [
    {
      label: 'Driving Limit',
      value: hos.driving_limit_hours,
      max: 11,
      unit: 'h',
      color: 'var(--color-teal)',
    },
    {
      label: '14-Hr Window',
      value: hos.shift_window_hours,
      max: 14,
      unit: 'h',
      color: 'var(--color-amber)',
    },
    {
      label: '70-Hr Cycle Remaining',
      value: hos.cycle_remaining_hours,
      max: 70,
      unit: 'h',
      color: hos.cycle_remaining_hours < 15 ? 'var(--color-red)' : 'var(--color-teal)',
    },
    {
      label: 'Cycle Used',
      value: hos.cycle_used_hours,
      max: 70,
      unit: 'h',
      color: hos.cycle_percent_used > 85 ? 'var(--color-red)' : 'var(--color-amber)',
    },
  ]

  // Filter to meaningful timeline events (hide raw drive segments unless user wants them)
  const keyEvents = timeline.filter(e => e.type !== 'drive')

  const handleEventClick = (event, idx) => {
    setActiveTimelineIndex(idx)
    setMapFlyTarget({ lat: event.coordinates.lat, lng: event.coordinates.lng })
    setExpandedIdx(expandedIdx === idx ? null : idx)
  }

  return (
    <div className="panel panel-right">
      <div className="panel-header">
        <div className="panel-title">HOS Monitor</div>
        <div className="panel-subtitle">Live Hours of Service Status</div>
      </div>

      <div className="panel-body">
        {/* HOS Meters */}
        <div className="section-label">Compliance Meters</div>

        {meters.map(m => (
          <div key={m.label} className="hos-meter">
            <div className="hos-meter-label">
              <span className="hos-meter-name">{m.label}</span>
              <span className="hos-meter-value" style={{ color: m.color }}>
                {m.value.toFixed(1)}{m.unit}
              </span>
            </div>
            <div className="hos-meter-track">
              <motion.div
                className="hos-meter-fill"
                style={{ background: m.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>
        ))}

        {/* HOS Stats Row */}
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="stat-item" style={{ gridColumn: 'span 1' }}>
            <div className="stat-value" style={{ color: 'var(--color-red)' }}>{summary.sleep_stops}</div>
            <div className="stat-label">Sleep Stops</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--color-amber)' }}>{summary.breaks}</div>
            <div className="stat-label">Rest Breaks</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--color-amber)' }}>{summary.fuel_stops}</div>
            <div className="stat-label">Fuel Stops</div>
          </div>
        </div>

        {/* ETA */}
        {summary.eta && (
          <div className="card card-accent-teal" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>ESTIMATED ARRIVAL</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--color-teal)', fontWeight: 600 }}>
              {new Date(summary.eta).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {formatTime(summary.eta)} · {summary.total_duration_hours.toFixed(1)} hrs total
            </div>
          </div>
        )}

        <div className="section-divider" />

        {/* Journey Timeline */}
        <div className="section-label">Journey Timeline</div>
        <div className="section-label" style={{ color: 'var(--color-text-dim)', fontSize: '0.65rem', marginTop: -8, marginBottom: 12 }}>
          Click any stop to fly to it on the map
        </div>

        <div className="timeline">
          {keyEvents.map((event, idx) => {
            const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.on_duty
            const isExpanded = expandedIdx === idx
            const isActive = activeTimelineIndex === idx

            return (
              <div key={idx} className="timeline-item" onClick={() => handleEventClick(event, idx)}>
                {idx < keyEvents.length - 1 && <div className="timeline-line" style={{ background: isActive ? 'var(--color-teal)' : undefined }} />}

                <motion.div
                  className="timeline-icon"
                  style={{ background: cfg.bg, borderColor: isActive ? cfg.color : 'transparent', color: cfg.color }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span style={{ fontSize: '11px' }}>{cfg.icon}</span>
                </motion.div>

                <div className="timeline-content">
                  <div className="timeline-event-label" style={{ color: isActive ? cfg.color : 'var(--color-text-primary)' }}>
                    {event.label}
                  </div>
                  <div className="timeline-event-meta">
                    {formatTime(event.absolute_time)} · +{formatHours(event.elapsed_hours)}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          marginTop: 8,
                          background: cfg.bg,
                          border: `1px solid ${cfg.color}30`,
                          borderRadius: 6,
                          padding: '8px 10px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.7,
                        }}>
                          <div>Mile {event.mile_marker}</div>
                          <div>Duration: {formatHours(event.duration_hours)}</div>
                          {event.is_hos_critical && <div style={{ color: 'var(--color-red)' }}>⚠ HOS Critical Event</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
