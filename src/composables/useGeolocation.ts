export interface Coordinates {
  lat: number
  lng: number
  isFallback: boolean
}

const SEOUL_FALLBACK = { lat: 37.5796, lng: 126.977 }

export function getCurrentCoordinates(): Promise<Coordinates> {
  if (!navigator.geolocation) {
    return Promise.resolve({ ...SEOUL_FALLBACK, isFallback: true })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({ lat: coords.latitude, lng: coords.longitude, isFallback: false })
      },
      () => resolve({ ...SEOUL_FALLBACK, isFallback: true }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  })
}

export function watchCoordinates(onUpdate: (coords: Coordinates) => void): () => void {
  if (!navigator.geolocation) return () => {}

  const watchId = navigator.geolocation.watchPosition(
    ({ coords }) => onUpdate({ lat: coords.latitude, lng: coords.longitude, isFallback: false }),
    () => onUpdate({ ...SEOUL_FALLBACK, isFallback: true }),
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
