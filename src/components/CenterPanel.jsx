import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTripStore } from '../store/tripStore'
import MapPanel from './MapPanel'
import ELDViewer from './ELDViewer'

export default function CenterPanel({ forceMap = false, forceELD = false }) {
  const { tripData } = useTripStore()
  const [showELD, setShowELD] = useState(false)

  // forceMap / forceELD come from App's mobile tab control
  const displayELD = forceELD || (!forceMap && showELD && !!tripData)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', flex: 1 }}>
      {/* Map / ELD Toggle — only shown on desktop when trip data is available */}
      {tripData && !forceMap && !forceELD && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
          display: 'flex',
          background: 'rgba(13,15,18,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {[
            { label: '🗺 Map', id: false },
            { label: '📋 ELD Logs', id: true },
          ].map(tab => (
            <button
              key={String(tab.id)}
              onClick={() => setShowELD(tab.id)}
              style={{
                padding: '7px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                background: showELD === tab.id ? 'var(--color-teal)' : 'transparent',
                color: showELD === tab.id ? '#0d0f12' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: showELD === tab.id ? 600 : 400,
                transition: 'all 200ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Map view */}
        {!displayELD && (
          <motion.div
            key="map"
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MapPanel />
          </motion.div>
        )}

        {/* ELD view */}
        {displayELD && (
          <motion.div
            key="eld"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              background: 'var(--color-bg-secondary)',
              padding: 'var(--space-xl)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ELDViewer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
