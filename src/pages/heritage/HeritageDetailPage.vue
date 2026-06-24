<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { heritageApi } from '@/api/heritageApi'
import { loadKakaoMaps } from '@/utils/kakaoMaps'
import type { HeritageDetailResponse } from '@/types/api'
import ImageCarousel from '@/components/common/ImageCarousel.vue'

const PERIOD_NAMES: Record<string, string> = {
  PREHISTORIC: '선사시대',
  GOJOSEON: '고조선',
  THREE_KINGDOMS: '삼국시대',
  UNIFIED: '통일신라',
  GORYEO: '고려시대',
  JOSEON: '조선시대',
  OPENING: '개화기',
  JAPANESE: '일제강점기',
  MODERN: '근현대',
  UNKNOWN: '미상',
}

const route = useRoute()
const router = useRouter()

const heritage = ref<HeritageDetailResponse | null>(null)
const isLoading = ref(true)
const error = ref(false)
const mapElement = ref<HTMLElement | null>(null)
const mapError = ref(false)
let mapObject: { setMap?: (m: null) => void } | null = null

const heroImage = computed(() =>
  heritage.value?.mediaUrls[0] ?? heritage.value?.thumbnailUrl ?? null,
)

const carouselItems = computed(() =>
  (heritage.value?.mediaUrls ?? []).slice(1).map((url) => ({ url })),
)

const periodLabel = computed(() =>
  heritage.value?.period ? (PERIOD_NAMES[heritage.value.period] ?? heritage.value.period) : null,
)
const archivedExplanationQuery = computed(() => {
  const tripId = typeof route.query.tripId === 'string' ? route.query.tripId : ''
  const visitLogId = typeof route.query.visitLogId === 'string' ? route.query.visitLogId : ''
  const returnTo = typeof route.query.returnTo === 'string' ? route.query.returnTo : ''
  if (!tripId || !visitLogId) return ''

  const params = new URLSearchParams({ tripId, visitLogId })
  if (returnTo.startsWith('/')) params.set('returnTo', returnTo)
  return params.toString()
})
const canOpenArchivedExplanation = computed(() => !!archivedExplanationQuery.value)


async function renderMap() {
  if (!mapElement.value || !heritage.value) return
  try {
    const kakaoMaps = await loadKakaoMaps()
    const position = new kakaoMaps.LatLng(heritage.value.lat, heritage.value.lng)
    const map = new kakaoMaps.Map(mapElement.value, { center: position, level: 4 })

    const markerEl = document.createElement('div')
    markerEl.className = 'heritage-map-pin'
    markerEl.title = heritage.value.name
    const overlay = new kakaoMaps.CustomOverlay({
      position,
      content: markerEl,
      xAnchor: 0.5,
      yAnchor: 1,
    })
    overlay.setMap(map)
    mapObject = overlay
  } catch {
    mapError.value = true
  }
}

function openArchivedExplanation() {
  if (!archivedExplanationQuery.value) return
  router.push(`/heritage/explanation?${archivedExplanationQuery.value}`)
}

onMounted(async () => {
  try {
    const id = Number(route.params.heritageId)
    heritage.value = await heritageApi.getDetail(id)
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
  await nextTick()
  await renderMap()
})

onBeforeUnmount(() => {
  mapObject?.setMap?.(null)
  mapObject = null
})
</script>

<template>
  <div class="page">
    <!-- 로딩 -->
    <template v-if="isLoading">
      <div class="hero-skeleton" />
      <div class="content">
        <div class="skeleton sk-title" />
        <div class="skeleton sk-sub" />
        <div class="skeleton sk-tag" />
        <div class="skeleton sk-body" />
        <div class="skeleton sk-body" />
        <div class="skeleton sk-body short" />
      </div>
    </template>

    <!-- 에러 -->
    <template v-else-if="error || !heritage">
      <div class="error-wrap">
        <p>문화재 정보를 불러올 수 없어요.</p>
        <button class="back-btn-plain" @click="router.back()">돌아가기</button>
      </div>
    </template>

    <!-- 본문 -->
    <template v-else>
      <!-- 히어로 이미지 -->
      <div class="hero">
        <img v-if="heroImage" :src="heroImage" :alt="heritage.name" class="hero-img" />
        <div v-else class="hero-placeholder">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 44h28M13 36h22M17 32V18h14v14M12 18h24L24 6 12 18Z" />
          </svg>
        </div>
        <div class="hero-overlay" />
        <button class="back-btn" aria-label="뒤로가기" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="content">
        <!-- 이름 -->
        <div class="name-section">
          <h1 class="name">{{ heritage.name }}</h1>
          <p v-if="heritage.nameHanja" class="name-hanja">{{ heritage.nameHanja }}</p>
        </div>

        <!-- 태그 -->
        <div class="tags">
          <span v-if="heritage.category" class="tag">{{ heritage.category }}</span>
          <span v-if="periodLabel" class="tag tag--period">{{ periodLabel }}</span>
        </div>

        <section v-if="canOpenArchivedExplanation" class="visit-explanation-panel">
          <div>
            <strong>여행 중 생성한 해설이 있어요</strong>
            <p>이 방문 기록에서 만들었던 AI 해설과 심화 해설을 다시 볼 수 있습니다.</p>
          </div>
          <button type="button" @click="openArchivedExplanation">생성된 해설 보기</button>
        </section>

        <!-- 설명 -->
        <section v-if="heritage.description" class="section">
          <p class="section-label">HISTORICAL RECORD</p>
          <p class="description">{{ heritage.description }}</p>
        </section>

        <!-- 추가 사진 -->
        <section v-if="carouselItems.length > 0" class="section">
          <p class="section-label">GALLERY</p>
          <ImageCarousel :items="carouselItems" :height="200" />
        </section>

        <!-- 위치 정보 -->
        <section class="section">
          <p class="section-label">위치 정보</p>
          <div class="map-wrap">
            <div v-if="!mapError" ref="mapElement" class="map-canvas" aria-label="문화재 위치 지도" />
            <p v-else class="map-error">지도를 불러올 수 없어요.</p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  width: min(100%, var(--mobile-max-width));
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* hero */
.hero {
  position: relative;
  width: 100%;
  height: 280px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-surface-high);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-placeholder svg {
  width: 52px;
  color: var(--color-outline-variant);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%);
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(6px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.back-btn svg {
  width: 20px;
}

/* content */
.content {
  padding: 20px 20px 48px;
}

.name-section {
  margin-bottom: 12px;
}

.name {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--color-on-surface);
  line-height: 1.2;
  margin: 0;
}

.name-hanja {
  font-size: 14px;
  color: var(--color-on-surface-variant);
  margin: 4px 0 0;
}

/* tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
}

.tag {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  background: var(--color-surface-high);
  color: var(--color-on-surface-variant);
  letter-spacing: 0.02em;
}

.tag--period {
  background: var(--color-primary-container);
  color: var(--color-on-primary);
}

.visit-explanation-panel {
  display: grid;
  gap: 14px;
  margin-bottom: 26px;
  padding: 16px;
  border: 1px solid rgba(23, 52, 92, 0.16);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(26, 43, 72, 0.06);
}

.visit-explanation-panel strong {
  display: block;
  color: var(--color-on-surface);
  font-size: 15px;
  line-height: 1.35;
}

.visit-explanation-panel p {
  margin-top: 5px;
  color: var(--color-on-surface-variant);
  font-size: 12px;
  line-height: 1.55;
  word-break: keep-all;
}

.visit-explanation-panel button {
  min-height: 46px;
  border-radius: 10px;
  color: #fff;
  background: #17345c;
  font-size: 13px;
  font-weight: 800;
}

/* sections */
.section {
  margin-bottom: 28px;
}

.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin: 0 0 10px;
}

.description {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-on-surface-variant);
  white-space: pre-wrap;
}

/* location */
.map-wrap {
  border-radius: 14px;
  overflow: hidden;
}

.map-canvas {
  width: 100%;
  height: 200px;
  background: var(--color-surface-high);
}

.map-error {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 12px;
  color: var(--color-outline);
  background: var(--color-surface-high);
}

:global(.heritage-map-pin) {
  width: 28px;
  height: 28px;
  border: 3px solid white;
  border-radius: 50% 50% 50% 4px;
  background: var(--color-primary);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transform: rotate(-45deg);
}

/* skeleton */
.hero-skeleton {
  width: 100%;
  height: 280px;
  background: linear-gradient(90deg, var(--color-surface-high) 25%, var(--color-surface-highest) 50%, var(--color-surface-high) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, var(--color-surface-high) 25%, var(--color-surface-highest) 50%, var(--color-surface-high) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin-bottom: 12px;
}

.sk-title  { height: 32px; width: 70%; }
.sk-sub    { height: 16px; width: 40%; }
.sk-tag    { height: 24px; width: 30%; border-radius: 99px; }
.sk-body   { height: 14px; }
.sk-body.short { width: 60%; }

/* error */
.error-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 16px;
  color: var(--color-on-surface-variant);
  font-size: 14px;
}

.back-btn-plain {
  padding: 10px 24px;
  border-radius: 10px;
  background: var(--color-surface-high);
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-on-surface);
  cursor: pointer;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
