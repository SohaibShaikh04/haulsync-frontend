import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTripStore } from '../store/tripStore'
import MapPanel from './MapPanel'
import HOSPanel from './HOSPanel'
import ELDViewer from './ELDViewer'

export default function CenterPanel() {
  const { tripData } = useTripStore()
  const [showELD, setShowELD] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Map / ELD Toggle */}
      {tripData && (
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

      {/* Map */}
      <AnimatePresence mode="wait">
        {!showELD && (
          <motion.div
            key="map"
            style={{ flex: 1, overflow: 'hidden' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MapPanel />
          </motion.div>
        )}

        {/* ELD Viewer */}
        {showELD && tripData && (
          <motion.div
            key="eld"
            style={{
              flex: 1,
              overflowY: 'auto',
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
