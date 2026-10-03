import { useCallback, useState } from 'react'
import type { Coordinates } from '../types'

export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle')

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude })
        setStatus('ready')
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }, [])

  return { location, status, requestLocation }
}
