<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadKakaoMaps, type KakaoMap, type KakaoMapsApi } from '@/utils/kakaoMaps'
import type { CourseHeritage, VisitLogResponse } from '@/types/api'

const props = defineProps<{
  visitedLogs: VisitLogResponse[]
  courseHeritages: CourseHeritage[]
  courseTitle: string
  courseRegionName: string | undefined
}>()

const router = useRouter()

const mapElement = ref<HTMLElement | null>(null)
const mapErrorMessage = ref('')
const activeMapTab = ref<'visited' | 'course'>('visited')

let map: KakaoMap | null = null
let kakaoMaps: KakaoMapsApi | null = null
let mapObjects: Array<{ setMap(m: KakaoMap | null): void }> = []

const validVisitedLogs = computed(() =>
  [...props.visitedLogs]
    .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
    .sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()),
)

const validCourseHeritages = computed(() =>
  [...props.courseHeritages]
    .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng))
    .sort((a, b) => a.order - b.order),
)

const isMapEmpty = computed(() =>
  activeMapTab.value === 'visited'
    ? !validVisitedLogs.value.length
    : !validCourseHeritages.value.length,
)

function getCourseNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function clearMap() {
  mapObjects.forEach((o) => o.setMap(null))
  mapObjects = []
  map = null
}

function getCenter(points: { lat: number; lng: number }[]) {
  const total = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 })
  return { lat: total.lat / points.length, lng: total.lng / points.length }
}

async function renderVisitedMap() {
  if (!mapElement.value) return
  clearMap()
  mapErrorMessage.value = ''

  if (!validVisitedLogs.value.length) {
    mapElement.value.replaceChildren()
    return
  }

  try {
    kakaoMaps = await loadKakaoMaps()
    mapElement.value.replaceChildren()

    const center = getCenter(validVisitedLogs.value)
    map = new kakaoMaps.Map(mapElement.value, {
      center: new kakaoMaps.LatLng(center.lat, center.lng),
      level: 6,
    })

    const bounds = new kakaoMaps.LatLngBounds()
    const path = validVisitedLogs.value.map((log, index) => {
      const position = new kakaoMaps!.LatLng(log.lat, log.lng)
      bounds.extend(position)

      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = 'report-visited-marker'
      marker.title = log.heritageName
      marker.setAttribute('aria-label', `${index + 1}번째 방문, ${log.heritageName}`)
      marker.innerHTML = `<span>${index + 1}</span>`
      marker.addEventListener('click', () => router.push(`/heritage/${log.heritageId}`))

      const overlay = new kakaoMaps!.CustomOverlay({ position, content: marker, xAnchor: 0.5, yAnchor: 1.1, zIndex: 3 })
      overlay.setMap(map)
      mapObjects.push(overlay)

      return position
    })

    if (path.length > 1) {
      const shadow = new kakaoMaps.Polyline({ path, strokeColor: '#ffffff', strokeWeight: 8, strokeOpacity: 0.9, strokeStyle: 'solid' })
      shadow.setMap(map)
      mapObjects.push(shadow)

      const line = new kakaoMaps.Polyline({ path, strokeColor: '#1a2b48', strokeWeight: 4, strokeOpacity: 0.85, strokeStyle: 'solid' })
      line.setMap(map)
      mapObjects.push(line)
    }

    map.relayout()
    map.setBounds(bounds)
  } catch {
    mapErrorMessage.value = import.meta.env.VITE_KAKAO_MAP_APP_KEY
      ? '카카오 지도를 불러오지 못했어요. 허용 도메인 설정을 확인해 주세요.'
      : '카카오 지도 JavaScript 키 설정이 필요해요.'
  }
}

async function renderCourseMap() {
  if (!mapElement.value) return
  clearMap()
  mapErrorMessage.value = ''

  if (!validCourseHeritages.value.length) {
    mapElement.value.replaceChildren()
    return
  }

  try {
    kakaoMaps = await loadKakaoMaps()
    mapElement.value.replaceChildren()

    const center = getCenter(validCourseHeritages.value)
    map = new kakaoMaps.Map(mapElement.value, {
      center: new kakaoMaps.LatLng(center.lat, center.lng),
      level: 6,
    })

    const bounds = new kakaoMaps.LatLngBounds()
    const path = validCourseHeritages.value.map((heritage, index) => {
      const position = new kakaoMaps!.LatLng(heritage.lat, heritage.lng)
      bounds.extend(position)

      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = 'report-course-marker'
      marker.title = heritage.name
      marker.setAttribute('aria-label', `${index + 1}번째 추천 코스, ${heritage.name}`)
      marker.innerHTML = `<span>${index + 1}</span>`
      marker.addEventListener('click', () => router.push(`/heritage/${heritage.heritageId}`))

      const overlay = new kakaoMaps!.CustomOverlay({ position, content: marker, xAnchor: 0.5, yAnchor: 1, zIndex: 3 })
      overlay.setMap(map)
      mapObjects.push(overlay)

      return position
    })

    if (path.length > 1) {
      const shadow = new kakaoMaps.Polyline({ path, strokeColor: '#ffffff', strokeWeight: 8, strokeOpacity: 0.92, strokeStyle: 'solid' })
      shadow.setMap(map)
      mapObjects.push(shadow)

      const line = new kakaoMaps.Polyline({ path, strokeColor: '#d97706', strokeWeight: 4, strokeOpacity: 0.9, strokeStyle: 'solid' })
      line.setMap(map)
      mapObjects.push(line)
    }

    map.relayout()
    map.setBounds(bounds)
  } catch {
    mapErrorMessage.value = import.meta.env.VITE_KAKAO_MAP_APP_KEY
      ? '카카오 지도를 불러오지 못했어요. 허용 도메인 설정을 확인해 주세요.'
      : '카카오 지도 JavaScript 키 설정이 필요해요.'
  }
}

function renderMap() {
  nextTick(activeMapTab.value === 'visited' ? renderVisitedMap : renderCourseMap)
}

watch(validVisitedLogs, () => { if (activeMapTab.value === 'visited') renderMap() })
watch(validCourseHeritages, () => { if (activeMapTab.value === 'course') renderMap() })
watch(activeMapTab, renderMap)

onBeforeUnmount(clearMap)
</script>

<template>
  <section class="course-section">
    <div class="map-tabs">
      <button
        type="button"
        :class="{ active: activeMapTab === 'visited' }"
        @click="activeMapTab = 'visited'"
      >
        방문 경로
      </button>
      <button
        type="button"
        :class="{ active: activeMapTab === 'course' }"
        @click="activeMapTab = 'course'"
      >
        추천 코스
      </button>
    </div>

    <div class="course-map" :class="{ 'is-empty': isMapEmpty }">
      <div
        ref="mapElement"
        class="course-map-canvas"
        :aria-label="activeMapTab === 'visited' ? '방문 경로 지도' : '추천 코스 지도'"
      ></div>
      <div v-if="mapErrorMessage" class="course-map-error" role="alert">
        <strong>지도를 표시할 수 없어요</strong>
        <span>{{ mapErrorMessage }}</span>
      </div>
      <div v-else-if="isMapEmpty" class="course-map-empty">
        <strong>{{ activeMapTab === 'visited' ? '방문 기록이 없어요' : '추천 코스 좌표가 없어요' }}</strong>
        <span>{{ activeMapTab === 'visited' ? '문화재를 방문하면 경로가 표시됩니다.' : '코스가 준비되면 지도에 순서대로 표시됩니다.' }}</span>
      </div>
    </div>

    <div v-show="activeMapTab === 'visited'" class="course-copy">
      <span>이번 여행</span>
      <h2>방문한 유적지 경로</h2>
      <ol v-if="validVisitedLogs.length">
        <li v-for="(log, index) in validVisitedLogs" :key="log.id">
          <b>{{ getCourseNumber(index) }}</b>
          <button type="button" @click="router.push(`/heritage/${log.heritageId}`)">
            <strong>{{ log.heritageName }}</strong>
            <small>{{ formatTime(log.visitedAt) }} 방문</small>
          </button>
        </li>
      </ol>
      <p v-else>방문 기록이 없습니다.</p>
    </div>

    <div v-show="activeMapTab === 'course'" class="course-copy">
      <span>다음 여행 추천</span>
      <h2>{{ courseTitle }}</h2>
      <ol v-if="courseHeritages.length">
        <li v-for="(heritage, index) in courseHeritages" :key="heritage.heritageId">
          <b>{{ getCourseNumber(index) }}</b>
          <button type="button" @click="router.push(`/heritage/${heritage.heritageId}`)">
            <strong>{{ heritage.name }}</strong>
            <small>{{ courseRegionName }}의 다음 탐방 지점</small>
          </button>
        </li>
      </ol>
      <p v-else>추천 코스가 아직 준비되지 않았습니다.</p>
    </div>
  </section>
</template>

<style scoped>
.map-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #c5c6ce;
  background: #fff;
}

.map-tabs button {
  padding: 14px 0;
  color: #8b96a4;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-bottom: 3px solid transparent;
  transition: color 0.15s, border-bottom 0.15s;
}

.map-tabs button.active {
  color: #031632;
  border-bottom-color: #1a2b48;
}

.course-section {
  display: grid;
  margin-bottom: 56px;
  overflow: hidden;
  border: 1px solid #c5c6ce;
  border-radius: 4px;
  background: #eef4ff;
}

.course-map {
  position: relative;
  height: 280px;
  overflow: hidden;
  background: #d9e3f4;
}

.course-map-canvas {
  width: 100%;
  height: 100%;
}

.course-map.is-empty .course-map-canvas {
  opacity: 0;
}

.course-map-error,
.course-map-empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  padding: 28px;
  text-align: center;
  background:
    linear-gradient(135deg, rgba(3, 22, 50, 0.08) 25%, transparent 25%) 0 0 / 42px 42px,
    linear-gradient(45deg, transparent 48%, rgba(3, 22, 50, 0.24) 48% 51%, transparent 51%),
    #d9e3f4;
}

.course-map-error strong,
.course-map-empty strong {
  color: #031632;
  font-size: 17px;
}

.course-map-error span,
.course-map-empty span {
  max-width: 260px;
  margin-top: 6px;
  color: #5c5f60;
  font-size: 12px;
  line-height: 1.5;
}

.course-copy {
  padding: 26px 24px 30px;
}

.course-copy span {
  color: #5c5f60;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.course-copy h2 {
  margin-top: 8px;
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.course-copy ol {
  display: grid;
  gap: 18px;
  margin-top: 24px;
  list-style: none;
}

.course-copy li {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
}

.course-copy li > b {
  color: #aeb4bd;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.course-copy button {
  color: inherit;
  text-align: left;
}

.course-copy strong,
.course-copy small {
  display: block;
}

.course-copy strong {
  color: #031632;
  font-size: 15px;
}

.course-copy small,
.course-copy p {
  margin-top: 4px;
  color: #5c5f60;
  font-size: 13px;
  line-height: 1.45;
}

:global(.report-visited-marker) {
  display: grid;
  width: 34px;
  height: 34px;
  border: 2px solid #fff;
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: #1a2b48;
  box-shadow: 0 4px 12px rgba(3, 22, 50, 0.35);
  cursor: pointer;
}

:global(.report-visited-marker span) {
  font-size: 12px;
  font-weight: 900;
}

:global(.report-course-marker) {
  display: grid;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50% 50% 50% 5px;
  place-items: center;
  color: #fff;
  background: #031632;
  box-shadow: 0 6px 16px rgba(3, 22, 50, 0.28);
  cursor: pointer;
  transform: rotate(-45deg);
}

:global(.report-course-marker span) {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
  transform: rotate(45deg);
}
</style>
