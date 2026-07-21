import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTripStore } from '../store/tripStore'

const TYPE_COLORS = {
  current: '#9aabb8',
  pickup: '#06D6A0',
  dropoff: '#06D6A0',
  fuel: '#FFB703',
  break: '#FFB703',
  sleep: '#7B61FF',
  on_duty: '#2EC4B6',
  drive: '#2EC4B6',
}

const TYPE_ICONS = {
  current: '📍',
  pickup: '📦',
  dropoff: '🏁',
  fuel: '⛽',
  break: '☕',
  sleep: '🌙',
}

export default function MapPanel() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const truckMarkerRef = useRef(null)
  const animationRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  const { tripData, mapFlyTarget, setMapFlyTarget } = useTripStore()

  // ── Initialize map once ──────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '© CartoDB © OpenStreetMap',
          },
        },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
      },
      center: [-96.7970, 32.7767],
      zoom: 5,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

    map.on('load', () => {
      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // ── Clear all markers ────────────────────────────────────────────
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (truckMarkerRef.current) {
      truckMarkerRef.current.remove()
      truckMarkerRef.current = null
    }
  }, [])

  // ── Animate truck along route ────────────────────────────────────
  const animateTruck = useCallback((coords) => {
    if (!truckMarkerRef.current || coords.length < 2) return
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    const totalDuration = 14000
    let start = null

    const step = (timestamp) => {
      if (!truckMarkerRef.current) return
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / totalDuration, 1)
      const rawIdx = progress * (coords.length - 1)
      const idx = Math.min(Math.floor(rawIdx), coords.length - 2)
      const frac = rawIdx - idx
      const lng = coords[idx][0] + frac * (coords[idx + 1][0] - coords[idx][0])
      const lat = coords[idx][1] + frac * (coords[idx + 1][1] - coords[idx][1])
      truckMarkerRef.current.setLngLat([lng, lat])
      if (progress < 1) animationRef.current = requestAnimationFrame(step)
    }

    animationRef.current = requestAnimationFrame(step)
  }, [])

  // ── Draw route + markers when tripData changes ───────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !tripData) return
    const map = mapRef.current
    if (!map.isStyleLoaded()) return

    // Remove existing route layers/source safely
    try {
      if (map.getLayer('route-glow')) map.removeLayer('route-glow')
      if (map.getLayer('route-line')) map.removeLayer('route-line')
      if (map.getSource('route')) map.removeSource('route')
    } catch (_) { /* ignore */ }

    clearMarkers()
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    const { route, timeline } = tripData

    // Add route source
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: route.coordinates },
      },
    })

    // Glow layer
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#2EC4B6',
        'line-width': 12,
        'line-opacity': 0.12,
        'line-blur': 10,
      },
    })

    // Route line
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#2EC4B6',
        'line-width': 3,
        'line-opacity': 0.92,
      },
      layout: { 'line-join': 'round', 'line-cap': 'round' },
    })

    // Stop markers
    const stopTypes = ['current', 'pickup', 'dropoff', 'fuel', 'break', 'sleep']
    timeline
      .filter(e => stopTypes.includes(e.type))
      .forEach(event => {
        const color = TYPE_COLORS[event.type] || '#2EC4B6'
        const el = document.createElement('div')
        el.style.cssText = `
          width:28px;height:28px;border-radius:50%;
          background:${color};border:2px solid rgba(255,255,255,0.18);
          display:flex;align-items:center;justify-content:center;
          font-size:12px;cursor:pointer;
          box-shadow:0 0 12px ${color}60;
          transition:transform 150ms ease;
        `
        el.innerHTML = TYPE_ICONS[event.type] || '●'
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)' })
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })

        const popup = new maplibregl.Popup({ offset: 16, closeButton: false })
          .setHTML(`
            <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e8edf2;padding:4px;">
              <div style="font-weight:600;color:${color};margin-bottom:3px;">${event.label}</div>
              <div style="color:#9aabb8;">Mile ${event.mile_marker}</div>
              <div style="color:#9aabb8;">+${Number(event.elapsed_hours).toFixed(1)}h elapsed</div>
            </div>
          `)

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([event.coordinates.lng, event.coordinates.lat])
          .setPopup(popup)
          .addTo(map)

        markersRef.current.push(marker)
      })

    // Truck marker at pickup
    const pickupEvent = timeline.find(e => e.type === 'pickup')
    if (pickupEvent) {
      const truckEl = document.createElement('div')
      truckEl.style.cssText = `
        width:34px;height:34px;background:#131619;
        border:2px solid #2EC4B6;border-radius:6px;
        display:flex;align-items:center;justify-content:center;
        font-size:18px;box-shadow:0 0 16px rgba(46,196,182,0.4);z-index:100;
      `
      truckEl.innerHTML = '🚛'
      truckMarkerRef.current = new maplibregl.Marker({ element: truckEl })
        .setLngLat([pickupEvent.coordinates.lng, pickupEvent.coordinates.lat])
        .addTo(map)
    }

    // Fit map to route
    if (route.coordinates.length > 1) {
      const bounds = route.coordinates.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(route.coordinates[0], route.coordinates[0])
      )
      map.fitBounds(bounds, { padding: 70, duration: 1400, maxZoom: 10 })
    }

    // Animate truck
    animateTruck(route.coordinates)
  }, [tripData, mapReady, clearMarkers, animateTruck])

  // ── Fly-to when timeline item clicked ───────────────────────────
  useEffect(() => {
    if (!mapFlyTarget || !mapRef.current) return
    mapRef.current.flyTo({
      center: [mapFlyTarget.lng, mapFlyTarget.lat],
      zoom: 11,
      duration: 900,
      essential: true,
    })
    setMapFlyTarget(null)
  }, [mapFlyTarget, setMapFlyTarget])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Map container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* MapLibre style overrides */}
      <style>{`
        .maplibregl-popup-content {
          background:#1c2128!important;border:1px solid #2a2f38!important;
          border-radius:8px!important;padding:8px 12px!important;
          box-shadow:0 4px 20px rgba(0,0,0,.6)!important;
        }
        .maplibregl-popup-tip{border-top-color:#2a2f38!important;}
        .maplibregl-ctrl-group{background:#1c2128!important;border:1px solid #2a2f38!important;border-radius:8px!important;}
        .maplibregl-ctrl-group button{background:#1c2128!important;color:#9aabb8!important;}
        .maplibregl-ctrl-group button:hover{background:#222830!important;}
        .maplibregl-ctrl-scale{background:rgba(13,15,18,.8)!important;color:#9aabb8!important;border-color:#2a2f38!important;font-family:'IBM Plex Mono',monospace!important;font-size:10px!important;}
        .maplibregl-ctrl-attrib{display:none;}
      `}</style>

      {/* Empty state */}
      {!tripData && (
        <div className="map-empty-state">
          <div className="map-empty-icon">🗺️</div>
          <div className="map-empty-text">Route Visualization</div>
          <div className="map-empty-sub">Enter trip details and generate a route to see the interactive map</div>
        </div>
      )}

      {/* Top-left info chip */}
      {tripData && (
        <div className="map-overlay-info">
          <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.68rem',color:'var(--color-text-muted)',marginBottom:4 }}>ROUTE ACTIVE</div>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.9rem',color:'var(--color-teal)',fontWeight:600 }}>
            {tripData.summary.distance_miles.toFixed(0)} mi
          </div>
        </div>
      )}

      {/* Bottom stats bar */}
      {tripData && (
        <div className="map-overlay-eta">
          {[
            { label: 'DISTANCE',   value: `${tripData.summary.distance_miles.toFixed(1)} mi`, color: 'var(--color-teal)' },
            { label: 'DRIVE TIME', value: `${tripData.summary.drive_time_hours.toFixed(1)} hrs`, color: 'var(--color-amber)' },
            { label: 'DAYS',       value: tripData.summary.days, color: 'var(--color-text-primary)' },
            { label: 'FUEL STOPS', value: tripData.summary.fuel_stops, color: 'var(--color-amber)' },
          ].map((item, i) => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:16 }}>
              {i > 0 && <div style={{ width:1, height:28, background:'var(--color-border)' }} />}
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.65rem',color:'var(--color-text-muted)' }}>{item.label}</div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.88rem',color:item.color,fontWeight:600 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
