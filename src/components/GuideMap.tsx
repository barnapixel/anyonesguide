import { createPlaceMarkerElement } from '../utils/mapMarkers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AttributionControl, LngLatBounds, Map, Marker, setWorkerUrl, type PaddingOptions, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LocateFixed } from 'lucide-react'
import { appConfig } from '../config'
import type { Coordinates, Guide, Place } from '../types'
import { distanceMeters } from '../utils/distance'
import { useI18n } from '../i18n'

type Props = {
  guide: Guide
  places: Place[]
  selectedPlace: Place | null
  onSelectPlace: (place: Place) => void
  userLocation: Coordinates | null
  locationStatus: 'idle' | 'loading' | 'ready' | 'denied' | 'error'
  onRequestLocation: () => void
}

// Keep MapLibre's worker outside Vite's optimized-dependency cache.
// predev/prebuild copy the matching worker + shared module into /public/vendor/maplibre.
setWorkerUrl(`${import.meta.env.BASE_URL}vendor/maplibre/maplibre-gl-worker.mjs`)

const NEAR_GUIDE_THRESHOLD_M = 20_000

// Soften the basemap while keeping the HTML place badges at full brightness.
const mutedRasterPaint = {
  'raster-brightness-max': 0.78,
  'raster-saturation': -0.15,
  'raster-contrast': 0.05,
} as const

const osmFallbackStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: mutedRasterPaint }],
}

function geoapifyRasterStyle(apiKey: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      geoapify: {
        type: 'raster',
        tiles: [`https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(apiKey)}`],
        tileSize: 256,
        maxzoom: 20,
        attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
      },
    },
    layers: [{ id: 'geoapify', type: 'raster', source: 'geoapify', paint: mutedRasterPaint }],
  }
}

function cameraPadding(): PaddingOptions {
  const mobile = window.matchMedia('(max-width: 520px)').matches
  return mobile
    ? { top: 142, right: 34, bottom: 122, left: 34 }
    : { top: 150, right: 60, bottom: 126, left: 60 }
}

function fitPlaces(map: Map, guide: Guide, places: Place[], animate: boolean) {
  const duration = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 650 : 0
  if (!places.length) {
    map.easeTo({ center: [guide.center.lng, guide.center.lat], zoom: 12.8, duration, padding: cameraPadding() })
    return
  }

  if (places.length === 1) {
    map.easeTo({ center: [places[0].lng, places[0].lat], zoom: 15, duration, padding: cameraPadding() })
    return
  }

  const bounds = new LngLatBounds()
  for (const place of places) bounds.extend([place.lng, place.lat])
  map.fitBounds(bounds, { padding: cameraPadding(), maxZoom: 14.6, duration })
}

function isUserNearGuide(userLocation: Coordinates, places: Place[]) {
  if (!places.length) return false
  return Math.min(...places.map(place => distanceMeters(userLocation, { lat: place.lat, lng: place.lng }))) <= NEAR_GUIDE_THRESHOLD_M
}

function userCenteredZoom(userLocation: Coordinates, places: Place[]) {
  if (!places.length) return 14
  const distances = places
    .map(place => distanceMeters(userLocation, { lat: place.lat, lng: place.lng }))
    .sort((a, b) => a - b)
  const index = Math.min(distances.length - 1, Math.floor((distances.length - 1) * 0.75))
  const typicalDistance = distances[index]

  if (typicalDistance <= 900) return 14.4
  if (typicalDistance <= 2_000) return 13.7
  if (typicalDistance <= 4_000) return 13.0
  if (typicalDistance <= 8_000) return 12.2
  if (typicalDistance <= 14_000) return 11.6
  return 11.2
}

function frameAroundUser(map: Map, userLocation: Coordinates, places: Place[], animate: boolean) {
  map.easeTo({
    center: [userLocation.lng, userLocation.lat],
    zoom: userCenteredZoom(userLocation, places),
    duration: animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 650 : 0,
    padding: cameraPadding(),
  })
}

function viewportMeaningfullyContains(map: Map, places: Place[]) {
  if (!places.length) return true
  const bounds = map.getBounds()
  const visible = places.filter(place => bounds.contains([place.lng, place.lat])).length
  return visible / places.length >= 0.7
}

export function GuideMap({ guide, places, selectedPlace, onSelectPlace, userLocation, locationStatus, onRequestLocation }: Props) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const placeMarkersRef = useRef<Marker[]>([])
  const userMarkerRef = useRef<Marker | null>(null)
  const didInitialFrameRef = useRef(false)
  const didAutoFrameLocationRef = useRef(false)
  const previousPlaceKeyRef = useRef('')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const style = useMemo(() => appConfig.geoapifyApiKey ? geoapifyRasterStyle(appConfig.geoapifyApiKey) : osmFallbackStyle, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    setMapError(false)
    setMapReady(false)
    didInitialFrameRef.current = false
    didAutoFrameLocationRef.current = false
    previousPlaceKeyRef.current = ''

    const map = new Map({
      container: containerRef.current,
      style,
      center: [guide.center.lng, guide.center.lat],
      zoom: 12.8,
      attributionControl: false,
    })
    map.addControl(new AttributionControl({ compact: false }), 'bottom-left')
    map.on('error', () => setMapError(true))
    map.on('load', () => {
      setMapError(false)
      map.resize()
      setMapReady(true)
    })
    mapRef.current = map
    const resizeTimer = window.setTimeout(() => map.resize(), 50)
    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [guide.center.lat, guide.center.lng, style])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    placeMarkersRef.current.forEach(marker => marker.remove())
    placeMarkersRef.current = places.map(place => {
      const button = createPlaceMarkerElement(place, selectedPlace?.id === place.id, onSelectPlace, t('star.label'))
      return new Marker({ element: button, anchor: 'center' }).setLngLat([place.lng, place.lat]).addTo(map)
    })
  }, [places, selectedPlace?.id, onSelectPlace, t])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    userMarkerRef.current?.remove()
    userMarkerRef.current = null
    if (!userLocation) return
    const dot = document.createElement('div')
    dot.className = 'user-location-dot'
    userMarkerRef.current = new Marker({ element: dot }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map)
  }, [userLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const placeKey = places.map(place => place.id).sort().join('|')

    if (!didInitialFrameRef.current) {
      if (userLocation && locationStatus === 'ready' && isUserNearGuide(userLocation, guide.places)) {
        frameAroundUser(map, userLocation, places.length ? places : guide.places, false)
        didAutoFrameLocationRef.current = true
      } else {
        fitPlaces(map, guide, places, false)
      }
      didInitialFrameRef.current = true
      previousPlaceKeyRef.current = placeKey
      return
    }

    if (userLocation && locationStatus === 'ready' && !didAutoFrameLocationRef.current) {
      didAutoFrameLocationRef.current = true
      if (isUserNearGuide(userLocation, guide.places)) {
        frameAroundUser(map, userLocation, places.length ? places : guide.places, true)
        previousPlaceKeyRef.current = placeKey
        return
      }
    }

    if (placeKey !== previousPlaceKeyRef.current) {
      previousPlaceKeyRef.current = placeKey
      if (!viewportMeaningfullyContains(map, places)) fitPlaces(map, guide, places, true)
    }
  }, [mapReady, places, guide, userLocation, locationStatus])

  const locate = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14.5, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650 })
    } else {
      onRequestLocation()
    }
  }

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map-canvas" />
      <button className={`locate-button ${locationStatus === 'loading' ? 'loading' : ''}`} onClick={locate} disabled={locationStatus === 'loading'} aria-label={t('map.locate')}>
        <LocateFixed size={20} />
      </button>
      {mapError && <div className="map-message map-error">{t('guide.mapError')}</div>}
      {!mapError && (locationStatus === 'denied' || locationStatus === 'error') && (
        <div className="map-message">{t('guide.locationUnavailable')}</div>
      )}
    </div>
  )
}
