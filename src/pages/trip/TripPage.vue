<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { tripApi } from '@/api/tripApi'
import { getCurrentCoordinates, type Coordinates } from '@/composables/useGeolocation'
import type { RecommendedHeritage, TripDetailResponse, TripResponse } from '@/types/api'
import { loadKakaoMaps, type KakaoMap, type KakaoMapsApi } from '@/utils/kakaoMaps'

const router = useRouter()
const trips = ref<TripResponse[]>([])
const activeTrip = ref<TripDetailResponse | null>(null)
const recommendations = ref<RecommendedHeritage[]>([])
const selectedHeritage = ref<RecommendedHeritage | null>(null)
const coordinates = ref<Coordinates | null>(null)
const mapElement = ref<HTMLElement | null>(null)
const title = ref('')
const tripDate = ref(new Date().toISOString().slice(0, 10))
const isLoading = ref(true)
const isSubmitting = ref(false)
const isCompleting = ref(false)
const isLoadingRecommendations = ref(false)
const showCompleteDialog = ref(false)
const errorMessage = ref('')
const mapErrorMessage = ref('')
let map: KakaoMap | null = null
let kakaoMaps: KakaoMapsApi | null = null
let mapObjects: Array<{ setMap(map: KakaoMap | null): void }> = []

const hasActiveTrip = computed(() => Boolean(activeTrip.value))
const visitedLogs = computed(() => activeTrip.value?.visitLogs ?? [])

function formatDate(value?: string | null) {
  if (!value) return '오늘'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${value}T00:00:00`))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function formatDistance(distanceM: number) {
  if (distanceM < 1000) return `${Math.round(distanceM)}m`
  return `${(distanceM / 1000).toFixed(1)}km`
}

async function loadTrips() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    trips.value = await tripApi.list()
    const current = trips.value.find((trip) => trip.status === 'IN_PROGRESS')
    if (current) {
      activeTrip.value = await tripApi.getDetail(current.tripId)
      coordinates.value = await getCurrentCoordinates()
      await loadRecommendations()
      await nextTick()
      await renderMap()
    }
  } catch {
    errorMessage.value = '여행 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

async function createTrip() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const tripId = await tripApi.create({
      title: title.value.trim() || undefined,
      tripDate: tripDate.value || undefined,
    })
    activeTrip.value = await tripApi.getDetail(tripId)
    coordinates.value = await getCurrentCoordinates()
    await loadRecommendations()
    await nextTick()
    await renderMap()
  } catch {
    errorMessage.value = '여행을 시작하지 못했어요. 입력 내용을 확인해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}

async function loadRecommendations() {
  if (!activeTrip.value || !coordinates.value) return

  isLoadingRecommendations.value = true
  try {
    const result = await tripApi.recommendNext(
      activeTrip.value.tripId,
      coordinates.value.lat,
      coordinates.value.lng,
    )
    const visitedHeritageIds = new Set(visitedLogs.value.map((log) => log.heritageId))
    recommendations.value = result.filter((heritage) => !visitedHeritageIds.has(heritage.heritageId))
    selectedHeritage.value = recommendations.value[0] ?? null
  } catch {
    recommendations.value = []
    selectedHeritage.value = null
    errorMessage.value = '주변 문화유산을 불러오지 못했어요.'
  } finally {
    isLoadingRecommendations.value = false
  }
}

function moveToCurrentLocation() {
  if (!map || !coordinates.value || !kakaoMaps) return
  const currentPosition = new kakaoMaps.LatLng(coordinates.value.lat, coordinates.value.lng)
  map.panTo(currentPosition)
  if (map.getLevel() > 4) map.setLevel(4, { anchor: currentPosition, animate: true })
}

async function refreshNearbyHeritages() {
  if (isLoadingRecommendations.value) return
  errorMessage.value = ''
  coordinates.value = await getCurrentCoordinates()
  await loadRecommendations()
  await renderMap()
}

async function renderMap() {
  if (!mapElement.value || !coordinates.value || !activeTrip.value) return
  mapErrorMessage.value = ''

  try {
    kakaoMaps = await loadKakaoMaps()
    mapObjects.forEach((object) => object.setMap(null))
    mapObjects = []
    mapElement.value.replaceChildren()

    const center = new kakaoMaps.LatLng(coordinates.value.lat, coordinates.value.lng)
    map = new kakaoMaps.Map(mapElement.value, { center, level: 4 })

    const currentMarker = document.createElement('div')
    currentMarker.className = 'current-location-marker'
    currentMarker.title = '현재 위치'
    currentMarker.innerHTML = '<span></span>'
    const currentOverlay = new kakaoMaps.CustomOverlay({
      position: center,
      content: currentMarker,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 3,
    })
    currentOverlay.setMap(map)
    mapObjects.push(currentOverlay)

    const routePoints = visitedLogs.value.map((log, index) => {
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
      const route = new kakaoMaps.Polyline({
        path: routePoints,
        strokeColor: '#1a365d',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
      })
      route.setMap(map)
      mapObjects.push(route)
    }

    recommendations.value.forEach((heritage) => {
      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = 'recommended-map-marker'
      marker.title = heritage.name
      marker.setAttribute('aria-label', `${heritage.name}, ${formatDistance(heritage.distanceM)}`)
      marker.innerHTML = '<span aria-hidden="true">◆</span>'
      marker.addEventListener('click', () => {
        selectedHeritage.value = heritage
      })
      const overlay = new kakaoMaps!.CustomOverlay({
        position: new kakaoMaps!.LatLng(heritage.lat, heritage.lng),
        content: marker,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 2,
      })
      overlay.setMap(map)
      mapObjects.push(overlay)
    })
  } catch {
    map = null
    mapErrorMessage.value = import.meta.env.VITE_KAKAO_MAP_APP_KEY
      ? '카카오 지도를 불러오지 못했어요. 허용 도메인 설정을 확인해 주세요.'
      : '카카오 지도 JavaScript 키 설정이 필요해요.'
  }
}

async function completeTrip() {
  if (!activeTrip.value || isCompleting.value) return
  isCompleting.value = true
  errorMessage.value = ''
  try {
    const tripId = activeTrip.value.tripId
    await tripApi.complete(tripId)
    showCompleteDialog.value = false
    await router.push(`/report/${tripId}`)
  } catch {
    errorMessage.value = '여행을 완료하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isCompleting.value = false
  }
}

onMounted(loadTrips)
onBeforeUnmount(() => {
  mapObjects.forEach((object) => object.setMap(null))
  mapObjects = []
  map = null
})
</script>

<template>
  <section v-if="isLoading" class="state-page" aria-live="polite">
    <span class="loader" />
    <p>여행 기록을 펼치는 중...</p>
  </section>

  <main v-else-if="!hasActiveTrip" class="create-trip-page">
    <header class="page-header">
      <RouterLink to="/" aria-label="홈으로 돌아가기">←</RouterLink>
      <strong>HisTour</strong>
      <span class="profile-dot" aria-hidden="true">H</span>
    </header>

    <section class="create-content">
      <div class="calendar-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16M8 13h3M13 13h3M8 16h3"/></svg>
      </div>
      <p class="eyebrow">NEW JOURNEY</p>
      <h1>새로운 여행 시작</h1>
      <p class="subtitle">기록하고 싶은 역사의 순간을 설정하세요.</p>

      <form @submit.prevent="createTrip">
        <label>
          <span>여행 제목</span>
          <div class="field">
            <input v-model="title" maxlength="40" placeholder="예: 서울 고궁 산책" />
            <svg viewBox="0 0 24 24"><path d="M5 5h10l4 4v10H5zM14 5v5h5M8 14h8M8 17h5"/></svg>
          </div>
        </label>
        <label>
          <span>날짜</span>
          <div class="field">
            <input v-model="tripDate" type="date" />
          </div>
        </label>

        <aside class="guide-box">
          <span>i</span>
          <p>여행이 시작되면 현재 위치를 기반으로 주변의 역사적 장소를 자동으로 탐색하고 기록을 보관합니다.</p>
        </aside>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
        <button class="primary-button" type="submit" :disabled="isSubmitting">
          <span aria-hidden="true">▶</span>{{ isSubmitting ? '여행 준비 중...' : 'Start Trip' }}
        </button>
      </form>
      <p class="archive-code">ARCHIVE SERIAL NO: {{ new Date().getFullYear() }}-HT-004</p>
    </section>
  </main>

  <main v-else class="active-trip-page">
    <header class="active-header">
      <div>
        <p>ACTIVE JOURNEY</p>
        <h1>{{ activeTrip?.title || '나의 역사 여행' }}</h1>
        <span>{{ formatDate(activeTrip?.tripDate) }} · 방문 {{ visitedLogs.length }}곳</span>
      </div>
      <button type="button" @click="showCompleteDialog = true">End Trip</button>
    </header>

    <section class="map-shell">
      <div ref="mapElement" class="map" aria-label="현재 여행 지도" />
      <div v-if="mapErrorMessage" class="map-error" role="alert">
        <strong>지도를 표시할 수 없어요</strong>
        <span>{{ mapErrorMessage }}</span>
      </div>
      <div class="map-caption">
        <strong>{{ coordinates?.isFallback ? '서울 중심 지도' : '현재 위치 연결됨' }}</strong>
        <span v-if="isLoadingRecommendations">주변 문화유산을 찾고 있어요.</span>
        <span v-else-if="recommendations.length">가까운 문화유산 {{ recommendations.length }}곳을 찾았어요.</span>
        <span v-else>{{ coordinates?.isFallback ? '위치 권한을 허용하면 현재 위치로 이동해요.' : '주변에 추천할 문화유산이 없어요.' }}</span>
      </div>

      <div class="map-actions" aria-label="지도 조작">
        <button type="button" aria-label="현재 위치로 이동" title="현재 위치로 이동" @click="moveToCurrentLocation">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1"/></svg>
        </button>
        <button type="button" :disabled="isLoadingRecommendations" aria-label="주변 문화유산 새로고침" title="주변 문화유산 새로고침" @click="refreshNearbyHeritages">
          <svg :class="{ spinning: isLoadingRecommendations }" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6.1 6.1L4 8M5.5 15A7 7 0 0 0 17.9 17.9L20 16"/></svg>
        </button>
      </div>

      <article v-if="selectedHeritage" class="heritage-preview" aria-live="polite">
        <img v-if="selectedHeritage.thumbnailUrl" :src="selectedHeritage.thumbnailUrl" :alt="selectedHeritage.name" />
        <div v-else class="preview-placeholder" aria-hidden="true">🏛</div>
        <div class="preview-content">
          <span>NEARBY HERITAGE · {{ formatDistance(selectedHeritage.distanceM) }}</span>
          <strong>{{ selectedHeritage.name }}</strong>
          <div class="preview-links">
            <RouterLink :to="`/heritage/${selectedHeritage.heritageId}`">상세 보기</RouterLink>
            <RouterLink class="scan-link" :to="`/trip/${activeTrip?.tripId}/scan`">
              <svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M8 12h8"/></svg>
              스캔하기
            </RouterLink>
          </div>
        </div>
      </article>

      <RouterLink v-else class="scan-button" :to="`/trip/${activeTrip?.tripId}/scan`" aria-label="문화재 스캔">
        <svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M8 12h8"/></svg>
        <span>문화재 스캔</span>
      </RouterLink>
    </section>

    <section class="visited-section">
      <div class="section-heading">
        <div><span>JOURNEY LOG</span><h2>방문한 문화재</h2></div>
        <strong>{{ visitedLogs.length }}</strong>
      </div>
      <div v-if="visitedLogs.length" class="visit-list">
        <article v-for="log in visitedLogs" :key="log.id" class="visit-card">
          <img v-if="log.photoUrl" :src="log.photoUrl" :alt="log.heritageName" />
          <div v-else class="photo-placeholder" aria-hidden="true">🏛</div>
          <div>
            <strong>{{ log.heritageName }}</strong>
            <span>Visited {{ formatTime(log.visitedAt) }}</span>
          </div>
        </article>
      </div>
      <div v-else class="empty-log">
        <span>⌖</span>
        <p>아직 기록된 문화재가 없어요.<br />스캔 버튼으로 첫 장소를 남겨보세요.</p>
      </div>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    </section>
  </main>

  <Teleport to="body">
    <div v-if="showCompleteDialog" class="dialog-backdrop" @click.self="showCompleteDialog = false">
      <section class="complete-dialog" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <div class="dialog-emblem">✓</div>
        <p>JOURNEY COMPLETE</p>
        <h2 id="complete-title">여행을 마칠까요?</h2>
        <span>완료하면 지금까지의 기록으로 여행 리포트와 역사 퀴즈를 만들 수 있어요.</span>
        <dl>
          <div><dt>방문 문화재</dt><dd>{{ visitedLogs.length }}곳</dd></div>
          <div><dt>여행 날짜</dt><dd>{{ formatDate(activeTrip?.tripDate) }}</dd></div>
        </dl>
        <button class="primary-button" type="button" :disabled="isCompleting" @click="completeTrip">
          {{ isCompleting ? '기록 정리 중...' : '여행 완료하기' }}
        </button>
        <button class="text-button" type="button" @click="showCompleteDialog = false">여행 계속하기</button>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.state-page { min-height: calc(100dvh - 60px); display: grid; place-content: center; gap: 14px; text-align: center; color: var(--color-on-surface-variant); }
.loader { width: 36px; height: 36px; margin: auto; border: 3px solid #d8e0ec; border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.create-trip-page, .active-trip-page { min-height: calc(100dvh - 60px); background: #f8f9ff; color: #14233a; }
.page-header { height: 62px; padding: 0 18px; border-bottom: 1px solid #d8dfeb; display: grid; grid-template-columns: 36px 1fr 36px; align-items: center; background: #fff; }
.page-header a { font-size: 21px; }
.page-header strong { font-family: var(--font-serif); font-size: 18px; }
.profile-dot { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; justify-self: end; color: white; background: #1b3152; font-size: 11px; }
.create-content { padding: 32px 28px 24px; text-align: center; }
.calendar-icon { width: 48px; height: 48px; margin: 0 auto 17px; border-radius: 13px; display: grid; place-items: center; color: #17345c; background: #e8f0fc; }
.calendar-icon svg { width: 25px; fill: none; stroke: currentColor; stroke-width: 1.7; }
.eyebrow { color: #c46c18; font-size: 10px; font-weight: 700; letter-spacing: .16em; }
.create-content h1 { margin-top: 6px; font-family: var(--font-serif); font-size: 25px; }
.subtitle { margin-top: 8px; color: #747e8c; font-size: 12px; }
form { margin-top: 34px; text-align: left; }
label { display: block; margin-top: 22px; }
label > span { display: block; margin-bottom: 9px; color: #263a56; font-size: 11px; font-weight: 700; }
.field { height: 52px; padding: 0 13px; border: 1px solid #cbd3df; display: flex; align-items: center; background: #fff; }
.field:focus-within { border-color: #1b3152; box-shadow: 0 0 0 3px rgba(27,49,82,.08); }
.field input { min-width: 0; width: 100%; height: 100%; border: 0; outline: 0; color: #14233a; background: transparent; }
.field input::placeholder { color: #a0a8b3; }
.field svg { width: 20px; fill: none; stroke: #8b95a4; stroke-width: 1.5; }
.guide-box { margin-top: 24px; padding: 16px; border: 1px solid #cbd8e9; display: flex; gap: 10px; color: #526074; background: #edf3fc; font-size: 11px; line-height: 1.55; }
.guide-box > span { width: 17px; height: 17px; border-radius: 50%; flex: 0 0 auto; text-align: center; color: white; background: #89a7cf; }
.primary-button { width: 100%; min-height: 54px; margin-top: 28px; border-radius: 2px; display: flex; align-items: center; justify-content: center; gap: 10px; color: white; background: #142b4c; font-weight: 700; }
.primary-button:disabled { opacity: .55; }
.archive-code { margin-top: 29px; color: #a3a8af; font-size: 8px; letter-spacing: .08em; }
.error-message { margin-top: 14px; color: #ba1a1a; font-size: 12px; text-align: center; }
.active-header { min-height: 92px; padding: 17px 18px; display: flex; align-items: center; justify-content: space-between; background: white; border-bottom: 1px solid #d7dfeb; }
.active-header p, .section-heading span { color: #c46c18; font-size: 9px; font-weight: 700; letter-spacing: .14em; }
.active-header h1 { margin-top: 3px; font-family: var(--font-serif); font-size: 21px; }
.active-header div > span { color: #7c8795; font-size: 10px; }
.active-header button { padding: 9px 13px; border-radius: 18px; color: white; background: #142b4c; font-size: 10px; font-weight: 700; }
.map-shell { position: relative; height: min(59dvh, 560px); min-height: 390px; overflow: hidden; }
.map { width: 100%; height: 100%; background: #e8e0cf; }
.map-error { position: absolute; z-index: 600; inset: 0; padding: 28px; display: grid; align-content: center; justify-items: center; text-align: center; background: #edf1f7; }
.map-error strong { font-family: var(--font-serif); font-size: 17px; }.map-error span { max-width: 270px; margin-top: 6px; color: #687485; font-size: 11px; line-height: 1.5; }
.map-caption { position: absolute; z-index: 500; top: 16px; left: 16px; padding: 10px 13px; border: 1px solid rgba(255,255,255,.8); border-radius: 8px; display: flex; flex-direction: column; background: rgba(255,255,255,.9); box-shadow: 0 5px 18px rgba(18,39,68,.15); backdrop-filter: blur(8px); }
.map-caption strong { font-size: 11px; }.map-caption span { margin-top: 2px; color: #6f7a87; font-size: 9px; }
.map-actions { position: absolute; z-index: 500; top: 16px; right: 16px; display: grid; gap: 8px; }
.map-actions button { width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.85); border-radius: 50%; display: grid; place-items: center; color: #17345c; background: rgba(255,255,255,.94); box-shadow: 0 5px 18px rgba(18,39,68,.18); backdrop-filter: blur(8px); }
.map-actions button:disabled { opacity: .6; cursor: wait; }
.map-actions svg { width: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.map-actions svg.spinning { animation: spin .8s linear infinite; }
.heritage-preview { position: absolute; z-index: 500; right: 14px; bottom: 16px; left: 14px; min-height: 112px; padding: 10px; border: 1px solid rgba(255,255,255,.9); border-radius: 14px; display: flex; gap: 12px; background: rgba(255,255,255,.96); box-shadow: 0 10px 28px rgba(18,39,68,.22); backdrop-filter: blur(12px); }
.heritage-preview > img, .preview-placeholder { width: 92px; min-height: 92px; border-radius: 9px; flex: 0 0 auto; object-fit: cover; }
.preview-placeholder { display: grid; place-items: center; color: #9b6a36; background: linear-gradient(145deg,#eee2ca,#d9cab0); font-size: 29px; }
.preview-content { min-width: 0; padding: 3px 1px 1px; display: flex; flex: 1; flex-direction: column; }
.preview-content > span { overflow: hidden; color: #c46c18; font-size: 8px; font-weight: 700; letter-spacing: .08em; text-overflow: ellipsis; white-space: nowrap; }
.preview-content > strong { margin-top: 3px; overflow: hidden; font-family: var(--font-serif); font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
.preview-links { margin-top: auto; display: flex; align-items: center; gap: 7px; }
.preview-links a { min-height: 32px; padding: 0 11px; border: 1px solid #cbd3df; border-radius: 17px; display: inline-flex; align-items: center; justify-content: center; color: #34465f; font-size: 10px; font-weight: 700; }
.preview-links .scan-link { border-color: #142b4c; gap: 5px; color: white; background: #142b4c; }
.preview-links svg { width: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; }
.scan-button { position: absolute; z-index: 500; right: 18px; bottom: 18px; padding: 13px 17px; border-radius: 28px; display: flex; align-items: center; gap: 8px; color: white; background: #142b4c; box-shadow: 0 8px 22px rgba(20,43,76,.3); font-size: 11px; font-weight: 700; }
.scan-button svg { width: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; }
.visited-section { padding: 22px 18px 30px; background: #f8f9ff; }
.section-heading { display: flex; align-items: end; justify-content: space-between; }.section-heading h2 { margin-top: 2px; font-family: var(--font-serif); font-size: 19px; }.section-heading > strong { color: #8b96a4; font-size: 22px; }
.visit-list { margin: 15px -18px 0; padding: 0 18px 8px; display: flex; gap: 11px; overflow-x: auto; scrollbar-width: none; }
.visit-card { width: 150px; flex: 0 0 auto; border: 1px solid #dce2eb; background: white; box-shadow: 0 4px 12px rgba(26,43,72,.06); }
.visit-card img, .photo-placeholder { width: 100%; height: 94px; object-fit: cover; }.photo-placeholder { display: grid; place-items: center; color: #9b6a36; background: linear-gradient(145deg,#eee2ca,#d9cab0); font-size: 30px; }
.visit-card > div { padding: 10px; display: flex; flex-direction: column; }.visit-card strong { font-family: var(--font-serif); font-size: 12px; }.visit-card span { margin-top: 3px; color: #848d98; font-size: 8px; }
.empty-log { margin-top: 15px; padding: 25px; border: 1px dashed #cbd3df; display: flex; align-items: center; justify-content: center; gap: 13px; color: #75808e; background: white; font-size: 11px; line-height: 1.5; }.empty-log > span { font-size: 25px; }
.dialog-backdrop { position: fixed; z-index: 10000; inset: 0; padding: 20px; display: grid; place-items: center; background: rgba(3,22,50,.68); backdrop-filter: blur(5px); }
.complete-dialog { width: min(100%, 360px); padding: 30px 25px 22px; text-align: center; color: #14233a; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
.dialog-emblem { width: 54px; height: 54px; margin: auto; border-radius: 50%; display: grid; place-items: center; color: white; background: #1c7750; font-size: 24px; }.complete-dialog > p { margin-top: 16px; color: #c46c18; font-size: 9px; font-weight: 700; letter-spacing: .15em; }.complete-dialog h2 { margin-top: 5px; font-family: var(--font-serif); font-size: 24px; }.complete-dialog > span { display: block; margin-top: 9px; color: #6f7987; font-size: 12px; line-height: 1.6; }.complete-dialog dl { margin-top: 22px; border-block: 1px solid #e0e5ec; }.complete-dialog dl div { padding: 12px 2px; display: flex; justify-content: space-between; }.complete-dialog dl div + div { border-top: 1px solid #edf0f4; }.complete-dialog dt { color: #7a8491; font-size: 11px; }.complete-dialog dd { font-size: 12px; font-weight: 700; }.complete-dialog .primary-button { margin-top: 22px; }.text-button { margin-top: 14px; color: #687485; font-size: 11px; }
:global(.current-location-marker span) { display: block; width: 20px; height: 20px; border: 5px solid white; border-radius: 50%; background: #2877c7; box-shadow: 0 0 0 2px #2877c7, 0 3px 10px rgba(0,0,0,.25); }
:global(.heritage-map-marker span) { width: 32px; height: 32px; border: 3px solid white; border-radius: 50% 50% 50% 4px; display: grid; place-items: center; transform: rotate(-45deg); color: white; background: #17345c; box-shadow: 0 4px 10px rgba(0,0,0,.3); font-size: 11px; font-weight: 700; }
:global(.heritage-map-marker span::first-letter) { transform: rotate(45deg); }
:global(.recommended-map-marker span) { width: 34px; height: 34px; border: 3px solid white; border-radius: 50% 50% 50% 4px; display: grid; place-items: center; transform: rotate(-45deg); color: white; background: #d97706; box-shadow: 0 4px 12px rgba(69,34,0,.35); font-size: 10px; }
:global(.recommended-map-marker span::first-letter) { transform: rotate(45deg); }
</style>
