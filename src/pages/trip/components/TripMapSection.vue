<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useDeviceHeading } from '@/composables/useDeviceHeading'
import type { Coordinates } from '@/composables/useGeolocation'
import type { HeritageMapItem, RecommendedHeritage, VisitLogResponse } from '@/types/api'
import { heritageApi } from '@/api/heritageApi'
import {
  loadKakaoMaps,
  type KakaoCluster,
  type KakaoMap,
  type KakaoMarker,
  type KakaoMarkerClusterer,
  type KakaoMapsApi,
} from '@/utils/kakaoMaps'

const props = defineProps<{
  coordinates: Coordinates | null
  recommendations: RecommendedHeritage[]
  selectedHeritage: RecommendedHeritage | null
  visitedLogs: VisitLogResponse[]
  isLoadingRecommendations: boolean
}>()

const emit = defineEmits<{
  refresh: []
  'update:selectedHeritage': [heritage: RecommendedHeritage]
}>()

const { heading, requestHeadingPermission, stopHeading } = useDeviceHeading()
const mapElement = ref<HTMLElement | null>(null)
const mapErrorMessage = ref('')
const clusterPopup = ref<HeritageMapItem[] | null>(null)

let map: KakaoMap | null = null
let kakaoMaps: KakaoMapsApi | null = null
let mapObjects: Array<{ setMap(map: KakaoMap | null): void }> = []
let currentMarkerElement: HTMLElement | null = null
let clusterer: KakaoMarkerClusterer | null = null
let idleDebounceTimer: ReturnType<typeof setTimeout> | null = null
const markerDataMap = new Map<KakaoMarker, HeritageMapItem>()

const MIN_ROUTE_CURVE_OFFSET = 0.00035
const ROUTE_CURVE_STEPS = 18

function formatDistance(distanceM: number) {
  if (distanceM < 1000) return `${Math.round(distanceM)}m`
  return `${(distanceM / 1000).toFixed(1)}km`
}

function getSortedVisitLogs() {
  return [...props.visitedLogs].sort(
    (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
  )
}

function getCurvedRoutePath(points: Array<{ lat: number; lng: number }>) {
  if (points.length < 2 || !kakaoMaps) return []

  const firstPoint = points[0]
  if (!firstPoint) return []

  const path = [new kakaoMaps.LatLng(firstPoint.lat, firstPoint.lng)]

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    if (!start || !end) continue

    const latDelta = end.lat - start.lat
    const lngDelta = end.lng - start.lng
    const distance = Math.hypot(latDelta, lngDelta)
    if (distance === 0) continue

    const direction = index % 2 === 0 ? 1 : -1
    const offset = Math.max(distance * 0.18, MIN_ROUTE_CURVE_OFFSET)
    const control = {
      lat: (start.lat + end.lat) / 2 - (lngDelta / distance) * offset * direction,
      lng: (start.lng + end.lng) / 2 + (latDelta / distance) * offset * direction,
    }

    for (let step = 1; step <= ROUTE_CURVE_STEPS; step += 1) {
      const t = step / ROUTE_CURVE_STEPS
      const inverse = 1 - t
      const lat = inverse * inverse * start.lat + 2 * inverse * t * control.lat + t * t * end.lat
      const lng = inverse * inverse * start.lng + 2 * inverse * t * control.lng + t * t * end.lng
      path.push(new kakaoMaps!.LatLng(lat, lng))
    }
  }

  return path
}

async function moveToCurrentLocation() {
  if (!map || !props.coordinates || !kakaoMaps) return
  try {
    await requestHeadingPermission()
  } catch {
    // 방향 센서 권한이 없어도 현재 위치 이동은 계속 제공합니다.
  }
  const currentPosition = new kakaoMaps.LatLng(props.coordinates.lat, props.coordinates.lng)
  map.panTo(currentPosition)
  if (map.getLevel() > 4) map.setLevel(4, { anchor: currentPosition, animate: true })
}

function panTo(lat: number, lng: number) {
  if (!map || !kakaoMaps) return
  clusterPopup.value = null
  map.panTo(new kakaoMaps.LatLng(lat, lng))
  if (map.getLevel() > 5) map.setLevel(5, { animate: true })
}

function onMapIdle() {
  if (idleDebounceTimer) clearTimeout(idleDebounceTimer)
  idleDebounceTimer = setTimeout(fetchViewportHeritages, 300)
}

async function fetchViewportHeritages() {
  if (!map || !kakaoMaps || !clusterer) return
  const bounds = map.getBounds()
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  try {
    const items = await heritageApi.getMapHeritages(
      sw.getLat(), sw.getLng(), ne.getLat(), ne.getLng(),
    )
    updateClusterer(items)
  } catch {
    // 시야 내 문화재 로딩 실패는 조용히 처리 (지도 동작에 영향 없음)
  }
}

function updateClusterer(items: HeritageMapItem[]) {
  if (!kakaoMaps || !clusterer) return
  clusterer.clear()
  markerDataMap.clear()
  clusterPopup.value = null

  const markers = items.map((item) => {
    const marker = new kakaoMaps!.Marker({
      position: new kakaoMaps!.LatLng(item.lat, item.lng),
      title: item.name,
    })
    markerDataMap.set(marker, item)
    kakaoMaps!.event.addListener(marker, 'click', () => {
      clusterPopup.value = [item]
    })
    return marker
  })

  clusterer.addMarkers(markers)
}

async function renderMap() {
  if (!mapElement.value || !props.coordinates) return
  mapErrorMessage.value = ''

  if (idleDebounceTimer) clearTimeout(idleDebounceTimer)
  clusterer?.clear()
  clusterer = null
  markerDataMap.clear()

  try {
    kakaoMaps = await loadKakaoMaps()
    mapObjects.forEach((object) => object.setMap(null))
    mapObjects = []
    mapElement.value.replaceChildren()

    const center = new kakaoMaps.LatLng(props.coordinates.lat, props.coordinates.lng)
    map = new kakaoMaps.Map(mapElement.value, { center, level: 4, maxLevel: 8 })

    currentMarkerElement = document.createElement('div')
    currentMarkerElement.className = 'current-location-marker'
    currentMarkerElement.title = '현재 위치'
    currentMarkerElement.style.setProperty('--device-heading', `${heading.value ?? 0}deg`)
    currentMarkerElement.classList.toggle('has-heading', heading.value !== null)
    currentMarkerElement.innerHTML = '<i aria-hidden="true"></i><span></span>'
    const currentOverlay = new kakaoMaps.CustomOverlay({
      position: center,
      content: currentMarkerElement,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 3,
    })
    currentOverlay.setMap(map)
    mapObjects.push(currentOverlay)

    const sortedVisitLogs = getSortedVisitLogs()
    const routePoints = sortedVisitLogs.map((log, index) => {
      const position = new kakaoMaps!.LatLng(log.lat, log.lng)
      const marker = document.createElement('div')
      marker.className = 'heritage-map-marker'
      marker.title = log.heritageName
      marker.innerHTML = `<span>${index + 1}</span>`
      const overlay = new kakaoMaps!.CustomOverlay({
        position,
        content: marker,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 2,
      })
      overlay.setMap(map)
      mapObjects.push(overlay)
      return position
    })

    if (routePoints.length > 1) {
      const routePath = getCurvedRoutePath(sortedVisitLogs)
      if (routePath.length > 1) {
        const routeShadow = new kakaoMaps.Polyline({
          path: routePath,
          strokeColor: '#ffffff',
          strokeWeight: 9,
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
        })
        routeShadow.setMap(map)
        mapObjects.push(routeShadow)

        const route = new kakaoMaps.Polyline({
          path: routePath,
          strokeColor: '#1a365d',
          strokeWeight: 4,
          strokeOpacity: 0.88,
          strokeStyle: 'shortdash',
        })
        route.setMap(map)
        mapObjects.push(route)
      }
    }

    clusterer = new kakaoMaps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 3,
      minClusterSize: 2,
      disableClickZoom: true,
      gridSize: 60,
    })

    kakaoMaps.event.addListener(clusterer, 'clusterclick', (cluster: KakaoCluster) => {
      const heritages = cluster
        .getMarkers()
        .map((m) => markerDataMap.get(m))
        .filter((h): h is HeritageMapItem => Boolean(h))
      if (heritages.length) clusterPopup.value = heritages
    })

    kakaoMaps.event.addListener(map, 'idle', onMapIdle)
    fetchViewportHeritages()
  } catch {
    map = null
    mapErrorMessage.value = import.meta.env.VITE_KAKAO_MAP_APP_KEY
      ? '카카오 지도를 불러오지 못했어요. 허용 도메인 설정을 확인해 주세요.'
      : '카카오 지도 JavaScript 키 설정이 필요해요.'
  }
}

watch(heading, (value) => {
  currentMarkerElement?.classList.toggle('has-heading', value !== null)
  if (value !== null) currentMarkerElement?.style.setProperty('--device-heading', `${value}deg`)
})

onBeforeUnmount(() => {
  stopHeading()
  if (idleDebounceTimer) clearTimeout(idleDebounceTimer)
  clusterer?.clear()
  clusterer = null
  markerDataMap.clear()
  mapObjects.forEach((object) => object.setMap(null))
  mapObjects = []
  currentMarkerElement = null
  map = null
})

defineExpose({ renderMap, panTo })
</script>

<template>
  <section class="map-shell">
    <div ref="mapElement" class="map" aria-label="현재 여행 지도" />
    <div v-if="mapErrorMessage" class="map-error" role="alert">
      <strong>지도를 표시할 수 없어요</strong>
      <span>{{ mapErrorMessage }}</span>
    </div>
    <div class="map-caption">
      <strong>{{ coordinates?.isFallback ? '서울 중심 지도' : '현재 위치 연결됨' }}</strong>
      <span v-if="isLoadingRecommendations">주변 문화유산을 찾고 있어요.</span>
      <span v-else-if="recommendations.length"
        >가까운 추천 유적지 {{ recommendations.length }}곳</span
      >
      <span v-else>{{
        coordinates?.isFallback
          ? '위치 권한을 허용하면 현재 위치로 이동해요.'
          : '주변에 추천할 문화유산이 없어요.'
      }}</span>
    </div>

    <div class="map-actions" aria-label="지도 조작">
      <button
        type="button"
        aria-label="현재 위치로 이동"
        title="현재 위치로 이동"
        @click="moveToCurrentLocation"
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1"
          />
        </svg>
      </button>
      <button
        type="button"
        :disabled="isLoadingRecommendations"
        aria-label="주변 추천 새로고침"
        title="주변 추천 새로고침"
        @click="emit('refresh')"
      >
        <svg :class="{ spinning: isLoadingRecommendations }" viewBox="0 0 24 24">
          <path
            d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6.1 6.1L4 8M5.5 15A7 7 0 0 0 17.9 17.9L20 16"
          />
        </svg>
      </button>
    </div>

    <!-- 클러스터/마커 클릭 팝업 -->
    <article v-if="clusterPopup" class="cluster-popup" role="dialog" aria-label="문화재 목록">
      <header>
        <span>문화재 {{ clusterPopup.length }}곳</span>
        <button type="button" aria-label="닫기" @click="clusterPopup = null">✕</button>
      </header>
      <ul>
        <li v-for="h in clusterPopup" :key="h.heritageId">
          <img v-if="h.thumbnailUrl" :src="h.thumbnailUrl" :alt="h.name" />
          <span v-else class="popup-thumb-placeholder" aria-hidden="true">🏛</span>
          <strong>{{ h.name }}</strong>
          <RouterLink :to="`/heritage/${h.heritageId}`">보기</RouterLink>
        </li>
      </ul>
    </article>

    <!-- 추천 선택 시 미리보기 -->
    <article
      v-else-if="selectedHeritage"
      class="heritage-preview"
      aria-live="polite"
    >
      <img
        v-if="selectedHeritage.thumbnailUrl"
        :src="selectedHeritage.thumbnailUrl"
        :alt="selectedHeritage.name"
      />
      <div v-else class="preview-placeholder" aria-hidden="true">🏛</div>
      <div class="preview-content">
        <span>추천 유적지 · {{ formatDistance(selectedHeritage.distanceM) }}</span>
        <strong>{{ selectedHeritage.name }}</strong>
        <div class="preview-links">
          <RouterLink :to="`/heritage/${selectedHeritage.heritageId}`">상세 보기</RouterLink>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.map-shell {
  position: relative;
  height: min(59dvh, 560px);
  min-height: 390px;
  overflow: hidden;
}
.map {
  width: 100%;
  height: 100%;
  background: #e8e0cf;
}

.map-error {
  position: absolute;
  z-index: 600;
  inset: 0;
  padding: 28px;
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  background: #edf1f7;
}
.map-error strong {
  font-family: var(--font-serif);
  font-size: 17px;
}
.map-error span {
  max-width: 270px;
  margin-top: 6px;
  color: #687485;
  font-size: 11px;
  line-height: 1.5;
}

.map-caption {
  position: absolute;
  z-index: 500;
  top: 16px;
  left: 16px;
  padding: 10px 13px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 18px rgba(18, 39, 68, 0.15);
  backdrop-filter: blur(8px);
}
.map-caption strong {
  font-size: 11px;
}
.map-caption span {
  margin-top: 2px;
  color: #6f7a87;
  font-size: 9px;
}

.map-actions {
  position: absolute;
  z-index: 500;
  top: 16px;
  right: 16px;
  display: grid;
  gap: 8px;
}
.map-actions button {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #17345c;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 5px 18px rgba(18, 39, 68, 0.18);
  backdrop-filter: blur(8px);
}
.map-actions button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.map-actions svg {
  width: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.map-actions svg.spinning {
  animation: spin 0.8s linear infinite;
}

/* 클러스터 팝업 */
.cluster-popup {
  position: absolute;
  z-index: 500;
  right: 14px;
  bottom: 16px;
  left: 14px;
  max-height: 230px;
  padding: 12px 14px 10px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 28px rgba(18, 39, 68, 0.22);
  backdrop-filter: blur(12px);
}
.cluster-popup header {
  flex: 0 0 auto;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cluster-popup header span {
  font-size: 11px;
  font-weight: 700;
  color: #17345c;
  letter-spacing: 0.04em;
}
.cluster-popup header button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #6f7a87;
  font-size: 12px;
}
.cluster-popup ul {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cluster-popup li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cluster-popup li img,
.popup-thumb-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  flex: 0 0 44px;
  object-fit: cover;
}
.popup-thumb-placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #eee2ca, #d9cab0);
  font-size: 18px;
}
.cluster-popup li strong {
  flex: 1;
  min-width: 0;
  font-family: var(--font-serif);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cluster-popup li a {
  flex: 0 0 auto;
  min-width: 40px;
  min-height: 28px;
  padding: 0 9px;
  border: 1px solid #cbd3df;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #34465f;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

/* 추천 선택 미리보기 */
.heritage-preview {
  position: absolute;
  z-index: 500;
  right: 14px;
  bottom: 16px;
  left: 14px;
  min-height: 112px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 28px rgba(18, 39, 68, 0.22);
  backdrop-filter: blur(12px);
}
.heritage-preview > img,
.preview-placeholder {
  width: 92px;
  min-height: 92px;
  border-radius: 9px;
  flex: 0 0 auto;
  object-fit: cover;
}
.preview-placeholder {
  display: grid;
  place-items: center;
  color: #9b6a36;
  background: linear-gradient(145deg, #eee2ca, #d9cab0);
  font-size: 29px;
}
.preview-content {
  min-width: 0;
  padding: 3px 1px 1px;
  display: flex;
  flex: 1;
  flex-direction: column;
}
.preview-content > span {
  overflow: hidden;
  color: #c46c18;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-content > strong {
  margin-top: 3px;
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-links {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 7px;
}
.preview-links a {
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #cbd3df;
  border-radius: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #34465f;
  font-size: 10px;
  font-weight: 700;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

:global(.current-location-marker) {
  position: relative;
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  pointer-events: none;
}
:global(.current-location-marker i) {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: rotate(var(--device-heading, 0deg));
  transition:
    opacity 0.2s ease,
    transform 0.12s linear;
}
:global(.current-location-marker.has-heading i) {
  opacity: 1;
}
:global(.current-location-marker i::before) {
  position: absolute;
  top: -3px;
  left: 50%;
  width: 0;
  height: 0;
  border-right: 8px solid transparent;
  border-bottom: 23px solid rgba(40, 119, 199, 0.82);
  border-left: 8px solid transparent;
  transform: translateX(-50%);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
  content: '';
}
:global(.current-location-marker span) {
  position: relative;
  z-index: 1;
  display: block;
  width: 20px;
  height: 20px;
  border: 5px solid white;
  border-radius: 50%;
  background: #2877c7;
  box-shadow:
    0 0 0 2px #2877c7,
    0 3px 10px rgba(0, 0, 0, 0.25);
}
:global(.heritage-map-marker span) {
  width: 32px;
  height: 32px;
  border: 3px solid white;
  border-radius: 50% 50% 50% 4px;
  display: grid;
  place-items: center;
  transform: rotate(-45deg);
  color: white;
  background: #17345c;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  font-size: 11px;
  font-weight: 700;
}
:global(.heritage-map-marker span::first-letter) {
  transform: rotate(45deg);
}
</style>
