export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoLatLngBounds {
  extend(position: KakaoLatLng): void
  getSouthWest(): KakaoLatLng
  getNorthEast(): KakaoLatLng
}

export interface KakaoMap {
  getLevel(): number
  getBounds(): KakaoLatLngBounds
  panTo(position: KakaoLatLng): void
  relayout(): void
  setBounds(bounds: KakaoLatLngBounds): void
  setLevel(level: number, options?: { anchor?: KakaoLatLng; animate?: boolean }): void
}

interface KakaoMapOptions {
  center: KakaoLatLng
  level: number
  maxLevel?: number
}

interface KakaoCustomOverlayOptions {
  position: KakaoLatLng
  content: HTMLElement
  xAnchor?: number
  yAnchor?: number
  zIndex?: number
}

interface KakaoPolylineOptions {
  path: KakaoLatLng[]
  strokeWeight: number
  strokeColor: string
  strokeOpacity: number
  strokeStyle?: string
}

interface KakaoMarkerOptions {
  position: KakaoLatLng
  title?: string
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
  getPosition(): KakaoLatLng
  getTitle(): string
}

interface KakaoMarkerClustererOptions {
  map: KakaoMap
  averageCenter?: boolean
  minLevel?: number
  minClusterSize?: number
  disableClickZoom?: boolean
  gridSize?: number
}

export interface KakaoCluster {
  getMarkers(): KakaoMarker[]
  getCenter(): KakaoLatLng
}

export interface KakaoMarkerClusterer {
  addMarkers(markers: KakaoMarker[], redraw?: boolean): void
  clear(): void
}

export interface KakaoMapsApi {
  load(callback: () => void): void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => {
    setMap(map: KakaoMap | null): void
    setPosition(position: KakaoLatLng): void
  }
  Polyline: new (options: KakaoPolylineOptions) => { setMap(map: KakaoMap | null): void }
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker
  MarkerClusterer: new (options: KakaoMarkerClustererOptions) => KakaoMarkerClusterer
  event: {
    addListener(
      target: KakaoMap | KakaoMarker | KakaoMarkerClusterer,
      type: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (...args: any[]) => void,
    ): void
  }
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsApi }
  }
}

let sdkPromise: Promise<KakaoMapsApi> | null = null

export function loadKakaoMaps(): Promise<KakaoMapsApi> {
  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao!.maps.load(() => resolve(window.kakao!.maps)))
  }

  if (sdkPromise) return sdkPromise

  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
  if (!appKey) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_APP_KEY is not configured'))
  }

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=clusterer`
    script.async = true
    script.addEventListener('load', () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK was not initialized'))
        return
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps))
    })
    script.addEventListener('error', () => reject(new Error('Kakao Maps SDK failed to load')))
    document.head.append(script)
  })

  return sdkPromise
}
