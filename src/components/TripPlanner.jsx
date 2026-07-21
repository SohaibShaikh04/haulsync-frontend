import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useTripStore } from '../store/tripStore'
import { planTrip } from '../services/api'

const LOADING_STEPS = [
  'Planning Route',
  'Analyzing HOS Compliance',
  'Calculating Rest Stops',
  'Locating Fuel Stations',
  'Generating Driver Logs',
  'Building Timeline',
]

// Simple geocoding using Nominatim (free, no API key)
async function geocodeLocation(name) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const data = await res.json()
  if (!data.length) throw new Error(`Could not geocode: ${name}`)
  return { name, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

export default function TripPlanner() {
  const {
    currentLocation, setCurrentLocation,
    pickupLocation, setPickupLocation,
    dropoffLocation, setDropoffLocation,
    cycleUsedHours, setCycleUsedHours,
    setTripData, setError, error,
    setIsLoading, isLoading,
    setLoadingStep, loadingStep,
    resetTrip,
    tripData,
  } = useTripStore()

  const [currentName, setCurrentName] = useState(currentLocation.name)
  const [pickupName, setPickupName] = useState(pickupLocation.name)
  const [dropoffName, setDropoffName] = useState(dropoffLocation.name)

  const mutation = useMutation({
    mutationFn: planTrip,
    onSuccess: (data) => {
      setTripData(data)
      setIsLoading(false)
    },
    onError: (err) => {
      setError(err?.response?.data?.details || err.message || 'Trip planning failed')
      setIsLoading(false)
    },
  })

  const handleGenerate = async () => {
    setError(null)
    resetTrip()
    setIsLoading(true)

    try {
      // Step 1: Planning Route
      setLoadingStep(0)
      const [current, pickup, dropoff] = await Promise.all([
        geocodeLocation(currentName),
        geocodeLocation(pickupName),
        geocodeLocation(dropoffName),
      ])
      setCurrentLocation(current)
      setPickupLocation(pickup)
      setDropoffLocation(dropoff)

      // Steps 2-6: advance while API call runs
      let step = 1
      const stepInterval = setInterval(() => {
        if (step < LOADING_STEPS.length - 1) {
          setLoadingStep(step++)
        }
      }, 900)

      mutation.mutate({ currentLocation: current, pickupLocation: pickup, dropoffLocation: dropoff, cycleUsedHours })

      setTimeout(() => {
        clearInterval(stepInterval)
        setLoadingStep(LOADING_STEPS.length - 1)
      }, 5000)

    } catch (e) {
      setError(e.message)
      setIsLoading(false)
    }
  }

  const InputRow = ({ label, value, onChange, color = 'var(--color-teal)' }) => (
    <div className="form-group">
      <label className="form-label">
        <span className="form-label-dot" style={{ background: color }} />
        {label}
      </label>
      <input
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}...`}
        disabled={isLoading}
      />
    </div>
  )

  return (
    <div className="panel" style={{ position: 'relative' }}>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ borderRadius: 0 }}
          >
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{ borderRadius: '50%' }}
            />
            <div className="loading-steps">
              {LOADING_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  className={`loading-step ${i === loadingStep ? 'active' : i < loadingStep ? 'done' : ''}`}
                  animate={{ opacity: i === loadingStep ? 1 : i < loadingStep ? 0.6 : 0.3 }}
                >
                  {i < loadingStep ? '✓ ' : i === loadingStep ? '▶ ' : '○ '}{step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">Trip Planner</div>
        <div className="panel-subtitle">Route + HOS Configuration</div>
      </div>

      <div className="panel-body">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ⚠ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs */}
        <div className="section-label">Waypoints</div>

        <InputRow
          label="Current Location"
          value={currentName}
          onChange={setCurrentName}
          color="var(--color-graphite)"
        />
        <InputRow
          label="Pickup Location"
          value={pickupName}
          onChange={setPickupName}
          color="var(--color-green)"
        />
        <InputRow
          label="Dropoff Location"
          value={dropoffName}
          onChange={setDropoffName}
          color="var(--color-red)"
        />

        <div className="section-divider" />
        <div className="section-label">Hours of Service</div>

        <div className="form-group">
          <label className="form-label">
            <span className="form-label-dot" style={{ background: 'var(--color-amber)' }} />
            Current Cycle Used (Hrs)
          </label>
          <input
            className="form-input form-input-mono"
            type="number"
            min="0"
            max="69"
            step="0.5"
            value={cycleUsedHours}
            onChange={e => setCycleUsedHours(e.target.value)}
            disabled={isLoading}
          />
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            {Math.max(0, 70 - cycleUsedHours).toFixed(1)} hrs remaining in 70-hr cycle
          </div>
        </div>

        {/* Cycle meter */}
        <div className="hos-meter" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="hos-meter-track">
            <motion.div
              className="hos-meter-fill"
              style={{ background: cycleUsedHours > 60 ? 'var(--color-red)' : cycleUsedHours > 45 ? 'var(--color-amber)' : 'var(--color-teal)' }}
              animate={{ width: `${Math.min((cycleUsedHours / 70) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <motion.button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={isLoading || !currentName || !pickupName || !dropoffName}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Planning...' : '↗ Generate Route'}
        </motion.button>

        {/* Trip Summary (when data loaded) */}
        <AnimatePresence>
          {tripData && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="section-divider" />
              <div className="section-label">Trip Summary</div>

              <div className="stat-grid">
                {[
                  { label: 'Distance', value: `${tripData.summary.distance_miles.toFixed(0)} mi` },
                  { label: 'Drive Time', value: `${tripData.summary.drive_time_hours.toFixed(1)} h` },
                  { label: 'Total Time', value: `${tripData.summary.total_duration_hours.toFixed(1)} h` },
                  { label: 'Days', value: tripData.summary.days },
                  { label: 'Fuel Stops', value: tripData.summary.fuel_stops },
                  { label: 'Rest Breaks', value: tripData.summary.breaks },
                  { label: 'Sleep Stops', value: tripData.summary.sleep_stops },
                  { label: 'Cycle Left', value: `${tripData.summary.cycle_remaining_hours.toFixed(1)} h` },
                ].map(({ label, value }, i) => (
                  <motion.div
                    key={label}
                    className="stat-item"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <div className="stat-value">{value}</div>
                    <div className="stat-label">{label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Waypoint chips */}
              <div className="section-label">Route</div>
              {[
                { name: tripData.trip.current.name, color: 'var(--color-graphite)', dist: '0 mi' },
                { name: tripData.trip.pickup.name, color: 'var(--color-green)', dist: `${tripData.route.legs[0]?.distance_miles.toFixed(0)} mi` },
                { name: tripData.trip.dropoff.name, color: 'var(--color-red)', dist: `${tripData.summary.distance_miles.toFixed(0)} mi` },
              ].map(({ name, color, dist }) => (
                <div key={name} className="waypoint-chip">
                  <div className="waypoint-indicator" style={{ background: color }} />
                  <div className="waypoint-name">{name}</div>
                  <div className="waypoint-dist">{dist}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
