import { motion } from 'framer-motion'

export default function AppHeader({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-logo">
        <div className="header-logo-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 10L4 5H12L15 10H1Z" fill="#0d0f12" />
            <rect x="2" y="10" width="12" height="4" rx="1" fill="#0d0f12" />
            <circle cx="4.5" cy="14" r="1.5" fill="#0d0f12" />
            <circle cx="11.5" cy="14" r="1.5" fill="#0d0f12" />
          </svg>
        </div>
        <div className="header-logo-text">
          Haul<span>Sync</span>
        </div>
        <div style={{
          marginLeft: 8,
          padding: '2px 8px',
          background: 'var(--color-teal-dim)',
          border: '1px solid var(--color-teal)',
          borderRadius: 'var(--radius-full)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--color-teal)',
          letterSpacing: '0.05em',
        }}>
          FMCSA HOS
        </div>
      </div>

      <div className="header-status">
        <div className="status-badge">
          <div className="status-dot" />
          <span>OSRM Routing Active</span>
        </div>
        <div className="status-badge">
          <span style={{ color: 'var(--color-amber)' }}>⚡</span>
          <span>HOS Engine Online</span>
        </div>
        <motion.div
          style={{
            padding: '4px 12px',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--color-text-muted)',
          }}
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC
        </motion.div>

        {/* Theme Toggle */}
        <motion.button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </motion.button>
      </div>
    </header>
  )
}
