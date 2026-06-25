<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ImageCarousel, { type CarouselItem } from '@/components/common/ImageCarousel.vue'
import { reportApi } from '@/api/reportApi'
import { quizApi } from '@/api/quizApi'
import { tripApi } from '@/api/tripApi'
import { normalizeAssetUrl } from '@/utils/assetUrl'
import { loadKakaoMaps, type KakaoMap, type KakaoMapsApi } from '@/utils/kakaoMaps'
import type {
  CourseHeritage,
  QuizResultResponse,
  ReportResponse,
  VisitedHeritage,
  VisitLogResponse,
} from '@/types/api'

const route = useRoute()
const router = useRouter()

const report = ref<ReportResponse | null>(null)
const quizResult = ref<QuizResultResponse | null>(null)
const visitLogs = ref<VisitLogResponse[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const courseMapElement = ref<HTMLElement | null>(null)
const courseMapErrorMessage = ref('')

const tripId = computed(() => Number(route.params.tripId))
const visitedHeritages = computed(() => report.value?.visitedHeritages ?? [])
const visitLogByHeritageId = computed(() => {
  const logs = new Map<number, VisitLogResponse>()
  visitLogs.value.forEach((log) => {
    if (!logs.has(log.heritageId)) logs.set(log.heritageId, log)
  })
  return logs
})
const courseHeritages = computed(() => report.value?.course?.heritages ?? [])
const validCourseHeritages = computed(() =>
  [...courseHeritages.value]
    .filter((heritage) => Number.isFinite(heritage.lat) && Number.isFinite(heritage.lng))
    .sort((a, b) => a.order - b.order),
)
const validVisitedLogs = computed(() =>
  [...visitLogs.value]
    .filter((log) => Number.isFinite(log.lat) && Number.isFinite(log.lng))
    .sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()),
)

const activeMapTab = ref<'visited' | 'course'>('visited')
const isMapEmpty = computed(() =>
  activeMapTab.value === 'visited'
    ? !validVisitedLogs.value.length
    : !validCourseHeritages.value.length,
)
const summaryParagraphs = computed(() => {
  const summary = report.value?.summary?.trim()
  if (!summary && visitedHeritages.value.length) {
    return [
      `이번 여행에서는 ${visitedHeritages.value.map((heritage) => heritage.name).join(', ')}을 둘러봤습니다.`,
      '각 유적지에서 남긴 기록을 바탕으로 여행의 흐름과 인상 깊었던 역사적 장면을 정리했습니다.',
    ]
  }
  if (!summary) return ['이번 여행의 방문 기록을 바탕으로 역사적 흐름을 정리했습니다.']
  return summary
    .split(/\n{2,}|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
})
const reportTitle = computed(() => {
  const first = visitedHeritages.value[0]?.name
  if (!first) return '여행 리포트'
  return `${first}에서 시작된 역사 여정`
})
const courseTitle = computed(() => {
  const course = report.value?.course
  if (!course) return '추천 코스 준비 중'
  return `${course.regionName} 추천 코스`
})
const quizResultMessage = computed(() => {
  const accuracy = quizResult.value?.accuracy ?? 0
  if (accuracy >= 80) return '이번 여행을 또렷하게 기억하고 있어요'
  if (accuracy >= 50) return '좋은 복습 흐름이에요'
  return '다시 읽어보면 더 오래 남을 기록이에요'
})

let courseMap: KakaoMap | null = null
let kakaoMaps: KakaoMapsApi | null = null
let mapObjects: Array<{ setMap(map: KakaoMap | null): void }> = []

onMounted(loadReport)

async function loadReport() {
  if (!Number.isFinite(tripId.value) || tripId.value <= 0) {
    errorMessage.value = '리포트를 불러올 여행 정보가 올바르지 않습니다.'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    const [reportResponse, tripDetail, submittedQuizResult] = await Promise.all([
      reportApi.get(tripId.value),
      tripApi.getDetail(tripId.value),
      loadSubmittedQuizResult(),
    ])
    report.value = reportResponse
    visitLogs.value = tripDetail.visitLogs
    quizResult.value = submittedQuizResult
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '여행 리포트를 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function getCourseNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function openHeritage(heritage: VisitedHeritage | CourseHeritage) {
  router.push(`/heritage/${heritage.heritageId}`)
}

const visitedCarouselItems = computed<CarouselItem[]>(() =>
  visitedHeritages.value.map((heritage, index) => {
    const visitLog = visitLogByHeritageId.value.get(heritage.heritageId)
    const params = visitLog?.explanation
      ? new URLSearchParams({
          tripId: String(visitLog.tripId),
          visitLogId: String(visitLog.id),
          returnTo: `/report/${visitLog.tripId}`,
        }).toString()
      : null
    return {
      url: heritage.thumbnailUrl ?? '/icon.png',
      label: `방문 ${String(index + 1).padStart(2, '0')} · ${heritage.name}`,
      linkTo: params
        ? `/heritage/${heritage.heritageId}?${params}`
        : `/heritage/${heritage.heritageId}`,
    }
  }),
)

function clearMap() {
  mapObjects.forEach((object) => object.setMap(null))
  mapObjects = []
  courseMap = null
}

function getCenter(points: { lat: number; lng: number }[]) {
  const total = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 })
  return { lat: total.lat / points.length, lng: total.lng / points.length }
}

async function renderVisitedMap() {
  if (!courseMapElement.value) return
  clearMap()
  courseMapErrorMessage.value = ''

  if (!validVisitedLogs.value.length) {
    courseMapElement.value.replaceChildren()
    return
  }

  try {
    kakaoMaps = await loadKakaoMaps()
    courseMapElement.value.replaceChildren()

    const center = getCenter(validVisitedLogs.value)
    courseMap = new kakaoMaps.Map(courseMapElement.value, {
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

      const overlay = new kakaoMaps!.CustomOverlay({
        position,
        content: marker,
        xAnchor: 0.5,
        yAnchor: 1.1,
        zIndex: 3,
      })
      overlay.setMap(courseMap)
      mapObjects.push(overlay)

      return position
    })

    if (path.length > 1) {
      const shadow = new kakaoMaps.Polyline({ path, strokeColor: '#ffffff', strokeWeight: 8, strokeOpacity: 0.9, strokeStyle: 'solid' })
      shadow.setMap(courseMap)
      mapObjects.push(shadow)

      const line = new kakaoMaps.Polyline({ path, strokeColor: '#1a2b48', strokeWeight: 4, strokeOpacity: 0.85, strokeStyle: 'solid' })
      line.setMap(courseMap)
      mapObjects.push(line)
    }

    courseMap.relayout()
    courseMap.setBounds(bounds)
  } catch {
    courseMapErrorMessage.value = import.meta.env.VITE_KAKAO_MAP_APP_KEY
      ? '카카오 지도를 불러오지 못했어요. 허용 도메인 설정을 확인해 주세요.'
      : '카카오 지도 JavaScript 키 설정이 필요해요.'
  }
}

async function renderCourseMap() {
  if (!courseMapElement.value) return
  clearMap()
  courseMapErrorMessage.value = ''

  if (!validCourseHeritages.value.length) {
    courseMapElement.value.replaceChildren()
    return
  }

  try {
    kakaoMaps = await loadKakaoMaps()
    courseMapElement.value.replaceChildren()

    const center = getCenter(validCourseHeritages.value)
    courseMap = new kakaoMaps.Map(courseMapElement.value, {
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
      marker.addEventListener('click', () => openHeritage(heritage))

      const overlay = new kakaoMaps!.CustomOverlay({
        position,
        content: marker,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 3,
      })
      overlay.setMap(courseMap)
      mapObjects.push(overlay)

      return position
    })

    if (path.length > 1) {
      const shadow = new kakaoMaps.Polyline({ path, strokeColor: '#ffffff', strokeWeight: 8, strokeOpacity: 0.92, strokeStyle: 'solid' })
      shadow.setMap(courseMap)
      mapObjects.push(shadow)

      const line = new kakaoMaps.Polyline({ path, strokeColor: '#d97706', strokeWeight: 4, strokeOpacity: 0.9, strokeStyle: 'solid' })
      line.setMap(courseMap)
      mapObjects.push(line)
    }

    courseMap.relayout()
    courseMap.setBounds(bounds)
  } catch {
    courseMapErrorMessage.value = import.meta.env.VITE_KAKAO_MAP_APP_KEY
      ? '카카오 지도를 불러오지 못했어요. 허용 도메인 설정을 확인해 주세요.'
      : '카카오 지도 JavaScript 키 설정이 필요해요.'
  }
}

function renderMap() {
  nextTick(activeMapTab.value === 'visited' ? renderVisitedMap : renderCourseMap)
}

async function loadSubmittedQuizResult() {
  try {
    return await quizApi.getResults(tripId.value)
  } catch {
    return null
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data as { message?: string }
    return data.message || fallback
  }
  return fallback
}

watch(validVisitedLogs, () => { if (activeMapTab.value === 'visited') renderMap() })
watch(validCourseHeritages, () => { if (activeMapTab.value === 'course') renderMap() })
watch(activeMapTab, renderMap)

onBeforeUnmount(() => {
  clearMap()
})
</script>

<template>
  <main class="report-page">
    <header class="report-topbar">
      <div class="brand-lockup">
        <img src="/icon.png" alt="HisTour" class="brand-avatar" />
        <strong>HisTour</strong>
      </div>
      <button type="button" aria-label="뒤로 가기" @click="router.back()">‹</button>
    </header>

    <section v-if="errorMessage" class="message-panel">
      <strong>리포트를 열지 못했어요</strong>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadReport">다시 시도</button>
    </section>

    <template v-else-if="report">
      <section class="report-hero">
        <div class="hero-meta">
          <span>여행 리포트</span>
          <i></i>
          <small>{{ visitedHeritages.length }}곳 방문</small>
        </div>
        <h1>{{ reportTitle }}</h1>
        <div class="hero-bars" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
      </section>

      <section class="narrative-section">
        <div class="artifact-preview">
          <img
            v-if="visitedHeritages[0]?.thumbnailUrl"
            :src="normalizeAssetUrl(visitedHeritages[0].thumbnailUrl)"
            :alt="visitedHeritages[0].name"
          />
          <div v-else class="image-fallback">HisTour</div>
          <span>HisTour 여행 기록</span>
        </div>

        <article class="narrative-copy">
          <div class="section-kicker">
            <span>✦</span>
            <h2>여행 요약</h2>
          </div>
          <p v-for="paragraph in summaryParagraphs" :key="paragraph">{{ paragraph }}</p>
        </article>
      </section>

      <section class="records-section">
        <div class="section-heading">
          <div>
            <h2>방문한 유적지</h2>
            <p>여행 중 다녀온 장소</p>
          </div>
        </div>

        <ImageCarousel
          v-if="visitedHeritages.length"
          :items="visitedCarouselItems"
          :height="240"
          :show-controls="true"
        />

        <div v-else class="empty-panel">
          <strong>방문 기록이 비어 있어요</strong>
          <p>완료된 여행의 방문 문화재가 있으면 리포트에 아카이브 카드로 표시됩니다.</p>
        </div>
      </section>

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
          <div ref="courseMapElement" class="course-map-canvas" :aria-label="activeMapTab === 'visited' ? '방문 경로 지도' : '추천 코스 지도'"></div>
          <div v-if="courseMapErrorMessage" class="course-map-error" role="alert">
            <strong>지도를 표시할 수 없어요</strong>
            <span>{{ courseMapErrorMessage }}</span>
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
                <small>{{ new Date(log.visitedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }} 방문</small>
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
              <button type="button" @click="openHeritage(heritage)">
                <strong>{{ heritage.name }}</strong>
                <small>{{ report.course?.regionName }}의 다음 탐방 지점</small>
              </button>
            </li>
          </ol>
          <p v-else>추천 코스가 아직 준비되지 않았습니다.</p>
        </div>
      </section>

      <section class="quiz-cta" :class="{ completed: quizResult }">
        <h2>여행 퀴즈</h2>
        <template v-if="quizResult">
          <div class="quiz-result-card">
            <span>{{ quizResultMessage }}</span>
            <strong>{{ quizResult.correctCount }}/{{ quizResult.totalCount }}</strong>
            <small>정답률 {{ quizResult.accuracy }}%</small>
          </div>
          <RouterLink class="result-link" :to="`/quiz/${report.tripId}`">퀴즈 결과 보기</RouterLink>
        </template>
        <p>여행 후 퀴즈로 방금 정리한 기록을 오래 남겨보세요.</p>
        <RouterLink :to="`/quiz/${report.tripId}`">퀴즈 풀기</RouterLink>
      </section>
    </template>
  </main>

  <LoadingOverlay v-if="isLoading" message="여행 리포트를 불러오고 있어요" />
</template>

<style scoped>
.report-page {
  width: min(100%, var(--mobile-max-width));
  margin: 0 auto;
  min-height: 100dvh;
  padding: 80px 16px 110px;
  color: #121c28;
  background: #f8f9ff;
}

.report-topbar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  width: 100%;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #c5c6ce;
  background: #f8f9ff;
}

@media (min-width: 768px) {
  .report-topbar {
    left: 50%;
    max-width: var(--mobile-max-width);
    transform: translateX(-50%);
  }
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-avatar {
  width: 32px;
  height: 32px;
  border: 1px solid #c5c6ce;
  border-radius: 50%;
  object-fit: cover;
}

.brand-lockup strong,
.report-hero h1,
.narrative-copy h2,
.section-heading h2,
.course-copy h2,
.quiz-cta h2 {
  color: #031632;
  font-family: Georgia, "Times New Roman", serif;
}

.brand-lockup strong {
  font-size: 24px;
}

.report-topbar button {
  color: #031632;
  font-size: 28px;
}

.message-panel,
.empty-panel,
.course-section {
  border: 1px solid #c5c6ce;
  border-radius: 4px;
  background: #fff;
}

.message-panel {
  padding: 22px;
}

.message-panel strong,
.empty-panel strong {
  color: #031632;
  font-size: 18px;
}

.message-panel p,
.empty-panel p {
  margin: 8px 0 16px;
  color: #5c5f60;
  font-size: 14px;
  line-height: 1.5;
}

.message-panel button {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 4px;
  color: #fff;
  background: #031632;
  font-weight: 800;
}

.report-hero {
  margin-bottom: 48px;
}

.hero-meta {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.hero-meta span {
  padding: 5px 10px;
  color: #fff;
  background: #1a2b48;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-meta i {
  height: 1px;
  background: #c5c6ce;
}

.hero-meta small,
.section-heading p,
.course-copy span {
  color: #5c5f60;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-hero h1 {
  font-size: 34px;
  line-height: 1.18;
}

.hero-bars {
  display: flex;
  gap: 8px;
  margin-top: 22px;
}

.hero-bars span:first-child {
  width: 52px;
  height: 4px;
  background: #1a2b48;
}

.hero-bars span:last-child {
  width: 18px;
  height: 4px;
  background: #c5c6ce;
}

.narrative-section {
  display: grid;
  gap: 26px;
  margin-bottom: 54px;
}

.artifact-preview {
  position: relative;
  aspect-ratio: 1 / 1;
  border: 1px solid #c5c6ce;
  padding: 14px;
  background: #fff;
}

.artifact-preview img,
.image-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.8) contrast(1.1);
}

.image-fallback {
  display: grid;
  place-items: center;
  color: #8293b5;
  background: #eef4ff;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28px;
}

.artifact-preview > span {
  position: absolute;
  right: 24px;
  bottom: 24px;
  padding: 9px 12px;
  color: #fff;
  background: rgba(26, 43, 72, 0.92);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.section-kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-kicker h2,
.section-heading h2,
.course-copy h2,
.quiz-cta h2 {
  font-size: 24px;
}

.narrative-copy p {
  color: #44474d;
  font-size: 15px;
  line-height: 1.75;
}

.narrative-copy p + p {
  margin-top: 14px;
}

.records-section {
  margin-bottom: 52px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}


.empty-panel {
  padding: 18px;
}

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
  transition: color 0.15s, border-bottom 0.15s;
  border-bottom: 3px solid transparent;
}

.map-tabs button.active {
  color: #031632;
  border-bottom-color: #1a2b48;
}

.course-section {
  display: grid;
  margin-bottom: 56px;
  overflow: hidden;
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
  align-content: center;
  justify-items: center;
  padding: 28px;
  place-items: center;
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

.course-copy h2 {
  margin-top: 8px;
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
  font-family: Georgia, "Times New Roman", serif;
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

.quiz-cta {
  text-align: center;
}

.quiz-cta p {
  margin: 8px auto 24px;
  color: #44474d;
  font-size: 14px;
  line-height: 1.6;
}

.quiz-cta.completed > p,
.quiz-cta.completed > a:not(.result-link) {
  display: none;
}

.quiz-result-card {
  display: grid;
  gap: 6px;
  margin: 16px 0 20px;
  padding: 22px;
  border: 1px solid #c5c6ce;
  border-radius: 4px;
  background: #fff;
}

.quiz-result-card span {
  color: #5c5f60;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.quiz-result-card strong {
  color: #031632;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 42px;
  line-height: 1;
}

.quiz-result-card small {
  color: #1a2b48;
  font-size: 13px;
  font-weight: 800;
}

.quiz-cta a {
  display: grid;
  min-height: 56px;
  border-bottom: 4px solid #010816;
  border-radius: 4px;
  place-items: center;
  color: #fff;
  background: #1a2b48;
  font-size: 16px;
  font-weight: 900;
  text-decoration: none;
}
</style>
