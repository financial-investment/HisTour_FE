<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { tripApi } from '@/api/tripApi'
import { heritageApi } from '@/api/heritageApi'
import type { TripResponse, RecommendedHeritage } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()
const isLoggingOut = ref(false)
const trips = ref<TripResponse[]>([])
const isLoadingTrips = ref(false)
const nearbyHeritages = ref<RecommendedHeritage[]>([])
const isLoadingNearby = ref(false)
const nearbyError = ref<'geo' | 'empty' | null>(null)
const completedTripThumb = ref<string | null>(null)
const tripsError = ref(false)

const activeTrip = computed(() => trips.value.find((t) => t.status === 'IN_PROGRESS') ?? null)
const latestCompletedTrip = computed(
  () => trips.value.find((t) => t.status === 'COMPLETED') ?? null,
)
const daysSinceLastTrip = computed(() => {
  const last = latestCompletedTrip.value
  if (!last) return null
  const dateStr = last.tripDate ?? last.createdAt.slice(0, 10)
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

async function loadNearby(tripId: number) {
  if (!navigator.geolocation) {
    nearbyError.value = 'geo'
    return
  }
  isLoadingNearby.value = true
  nearbyError.value = null
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const result = await tripApi.recommendNext(tripId, coords.latitude, coords.longitude, 10)
        nearbyHeritages.value = result.slice(0, 3)
        if (result.length === 0) nearbyError.value = 'empty'
      } catch {
        nearbyError.value = 'empty'
      } finally {
        isLoadingNearby.value = false
      }
    },
    () => {
      nearbyError.value = 'geo'
      isLoadingNearby.value = false
    },
    { timeout: 5000 },
  )
}

async function loadCompletedTripThumb(tripId: number) {
  try {
    const detail = await tripApi.getDetail(tripId)
    const firstLog = detail.visitLogs[0]
    if (!firstLog) return
    if (firstLog.photoUrl) {
      completedTripThumb.value = firstLog.photoUrl
      return
    }
    const heritage = await heritageApi.getDetail(firstLog.heritageId)
    completedTripThumb.value = heritage.thumbnailUrl
  } catch {
    // 조용히 실패
  }
}

watch(activeTrip, (trip) => {
  if (trip) loadNearby(trip.tripId)
})

async function loadTrips() {
  isLoadingTrips.value = true
  tripsError.value = false
  try {
    trips.value = await tripApi.list()
    if (latestCompletedTrip.value) loadCompletedTripThumb(latestCompletedTrip.value.tripId)
  } catch {
    tripsError.value = true
  } finally {
    isLoadingTrips.value = false
  }
}

onMounted(async () => {
  if (!userStore.user) {
    try {
      await userStore.loadProfile()
    } catch {
      // 조용히 실패
    }
  }
  await loadTrips()
})

async function handleLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await userStore.logout()
  } finally {
    await router.replace('/login')
    isLoggingOut.value = false
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10).replace(/-/g, '.')
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}
</script>

<template>
  <main class="main-page">
    <header class="top-bar">
      <RouterLink class="wordmark" to="/" aria-label="HisTour 홈">
        <span class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 96 96">
            <path d="M26 69 46 25c1.8-4 7.3-4 9.1 0L75 69" />
            <path d="M35 71c8.2-7.2 18.2-7.2 27 0" />
            <circle cx="50.5" cy="43.5" r="5.8" />
          </svg>
        </span>
        <strong>HisTour</strong>
      </RouterLink>
      <button class="logout-button" type="button" :disabled="isLoggingOut" @click="handleLogout">
        {{ isLoggingOut ? '로그아웃 중…' : '로그아웃' }}
      </button>
    </header>

    <!-- 웰컴 배너 -->
    <section class="welcome" aria-label="인사말">
      <div class="welcome-text">
        <p class="welcome-sub">오늘은 어떤 이야기를 만나볼까요?</p>
        <h1 class="welcome-title">
          <template v-if="userStore.user">{{ userStore.user.nickname }}님,</template>
          <template v-else>반가워요,</template>
          <br />역사 속으로 떠나봐요.
        </h1>
      </div>
      <div class="welcome-deco" aria-hidden="true">
        <svg class="deco-gate" viewBox="0 0 100 80">
          <path d="M10 70h80M18 62h64M28 56V34h44v22M22 34h56L50 8 22 34Z" />
          <path d="M36 38v16M50 38v16M64 38v16" />
          <circle cx="50" cy="22" r="3" />
        </svg>
        <div class="deco-dots"><span></span><span></span><span></span></div>
      </div>
    </section>

    <!-- 섹션 1: 여행 현황 -->
    <section class="trip-status" aria-label="여행 현황">
      <p class="section-label">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="6.5" r="2.5" />
          <path
            d="M8 1a5.5 5.5 0 0 1 5.5 5.5C13.5 10 8 15 8 15S2.5 10 2.5 6.5A5.5 5.5 0 0 1 8 1z"
          />
        </svg>
        현재 여행
      </p>

      <div v-if="isLoadingTrips" class="skeleton sk-card"></div>

      <!-- 진행 중인 여행 있음 -->
      <template v-else-if="activeTrip">
        <RouterLink to="/trip" class="active-card">
          <div class="active-card-top">
            <span class="active-badge">
              <span class="pulse"></span>
              진행 중
            </span>
            <span class="active-date">{{
              formatDate(activeTrip.tripDate ?? activeTrip.createdAt)
            }}</span>
          </div>
          <h2 class="active-title">{{ activeTrip.title ?? '진행 중인 여행' }}</h2>
          <div class="active-footer">
            <div class="active-visits">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 12.5c0-2.5 2.2-4 5-4s5 1.5 5 4"
                />
              </svg>
              {{ activeTrip.visitCount }}곳 방문
            </div>
            <span class="active-cta">
              계속 탐험하기
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h10M9 5l4 3-4 3" />
              </svg>
            </span>
          </div>
        </RouterLink>

        <!-- 주변 문화재 추천 -->
        <div class="nearby-section">
          <p class="nearby-label">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="6.5" r="2.5" />
              <path
                d="M8 1a5.5 5.5 0 0 1 5.5 5.5C13.5 10 8 15 8 15S2.5 10 2.5 6.5A5.5 5.5 0 0 1 8 1z"
              />
            </svg>
            근처에 이런 곳도 있어요
          </p>
          <div v-if="isLoadingNearby" class="nearby-list">
            <div v-for="i in 3" :key="i" class="skeleton sk-nearby"></div>
          </div>
          <ul v-else-if="nearbyHeritages.length > 0" class="nearby-list">
            <li v-for="h in nearbyHeritages" :key="h.heritageId">
              <RouterLink :to="`/heritage/${h.heritageId}`" class="nearby-item">
                <img
                  v-if="h.thumbnailUrl"
                  :src="h.thumbnailUrl"
                  :alt="h.name"
                  class="nearby-thumb"
                />
                <div v-else class="nearby-thumb-placeholder" aria-hidden="true"></div>
                <div class="nearby-info">
                  <span class="nearby-name">{{ h.name }}</span>
                  <span class="nearby-dist">{{ formatDistance(h.distanceM) }} 거리</span>
                </div>
                <svg class="nearby-arrow" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8h10M9 5l4 3-4 3" />
                </svg>
              </RouterLink>
            </li>
          </ul>
          <p v-else-if="nearbyError === 'geo'" class="nearby-empty">
            위치 권한이 필요해요. 브라우저 설정을 확인해 주세요.
          </p>
          <p v-else class="nearby-empty">현재 위치 주변에 추천할 문화재가 없어요.</p>
        </div>
      </template>

      <!-- 진행 중인 여행 없음 → 새 여행 제안 -->
      <RouterLink v-else to="/trip" class="start-card">
        <div class="start-text">
          <span class="start-badge">새로운 여행</span>
          <h2>내 주변의 역사를<br />발견해 보세요</h2>
          <p>위치 기반으로 가까운 문화유산을 찾아드려요</p>
        </div>
        <svg class="landmark" viewBox="0 0 150 120" aria-hidden="true">
          <path d="M20 97h112M30 88h90M40 82V50h70v32M33 50h84L75 18 33 50Z" />
          <path d="M52 55v25M75 55v25M98 55v25" />
          <circle cx="75" cy="37" r="4" />
        </svg>
      </RouterLink>
    </section>

    <!-- 섹션 2: 여행 기록 -->
    <section class="record-section" aria-label="여행 기록">
      <p class="section-label">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <path d="M5 2v2M11 2v2M2 7h12" />
        </svg>
        지난 여행
      </p>

      <!-- 완료된 여행 있음 -->
      <RouterLink
        v-if="latestCompletedTrip"
        :to="`/report/${latestCompletedTrip.tripId}`"
        class="recent-card"
      >
        <div class="recent-thumb-wrap">
          <img
            v-if="completedTripThumb"
            :src="completedTripThumb"
            :alt="latestCompletedTrip.title ?? '여행 대표 사진'"
            class="recent-thumb"
          />
          <div v-else class="recent-thumb-placeholder" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path d="M6 30h28M9 26h22M13 24V12h14v12M11 12h18L20 3 11 12Z" />
              <path d="M16 15v7M20 15v7M24 15v7" />
            </svg>
          </div>
          <span v-if="daysSinceLastTrip !== null" class="days-badge">
            {{ daysSinceLastTrip }}일 전
          </span>
        </div>
        <div class="recent-info">
          <span class="recent-label">가장 최근 여행</span>
          <h2 class="recent-title">{{ latestCompletedTrip.title ?? '이름 없는 여행' }}</h2>
          <div class="recent-meta">
            <span>
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
                <path d="M4 1.5v2M10 1.5v2M1.5 6h11" />
              </svg>
              {{ formatDate(latestCompletedTrip.tripDate ?? latestCompletedTrip.createdAt) }}
            </span>
            <span>
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <circle cx="7" cy="5.5" r="2.2" />
                <path
                  d="M7 1a4.5 4.5 0 0 1 4.5 4.5C11.5 9 7 13 7 13S2.5 9 2.5 5.5A4.5 4.5 0 0 1 7 1z"
                />
              </svg>
              {{ latestCompletedTrip.visitCount }}곳 방문
            </span>
          </div>
          <span class="recent-cta">
            여행 리포트 보기
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 7h10M8 4l4 3-4 3" />
            </svg>
          </span>
        </div>
      </RouterLink>

      <!-- 여행 목록 조회 실패 -->
      <div v-else-if="tripsError" class="error-card">
        <p>여행 목록을 불러오지 못했어요.</p>
        <button class="retry-btn" @click="loadTrips">다시 시도</button>
      </div>

      <!-- 완료된 여행 없음 -->
      <div v-else-if="!isLoadingTrips" class="guide-card">
        <p class="guide-title">HisTour 이렇게 사용해요</p>
        <ol class="guide-list">
          <li>
            <span class="guide-num">1</span>
            <div>
              <strong>여행 만들기</strong>
              <p>날짜와 이름을 입력해 여행을 시작하세요.</p>
            </div>
          </li>
          <li>
            <span class="guide-num">2</span>
            <div>
              <strong>현장에서 사진 찍기</strong>
              <p>문화재 앞에서 사진을 찍으면 AI가 역사 해설을 들려드려요.</p>
            </div>
          </li>
          <li>
            <span class="guide-num">3</span>
            <div>
              <strong>퀴즈로 기억 남기기</strong>
              <p>여행 후 퀴즈로 오늘 배운 역사를 오래 기억하세요.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  </main>
</template>

<style scoped>
.main-page {
  width: min(100%, var(--mobile-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 0 20px 96px;
  color: var(--color-text-base);
  background: var(--color-bg);
}

/* ── 탑바 ── */
.top-bar {
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: space-between;
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--color-primary-dark);
  text-decoration: none;
}

.wordmark strong {
  font-family: var(--font-serif);
  font-size: 20px;
  letter-spacing: -0.5px;
}

.brand-icon {
  display: grid;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  place-items: center;
  background: var(--color-primary-container);
}

.brand-icon svg {
  width: 27px;
}
.brand-icon path {
  fill: none;
  stroke: var(--color-accent-pale);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 8;
}
.brand-icon circle {
  fill: var(--color-accent);
}

.logout-button {
  padding: 7px 12px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 8px;
  color: var(--color-text-subtle);
  background: var(--color-surface-lowest);
  font-size: 12px;
  transition: background var(--transition);
}
.logout-button:hover:not(:disabled) {
  background: var(--color-surface-low);
}
.logout-button:disabled {
  opacity: 0.6;
}

/* ── 웰컴 배너 ── */
.welcome {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 180px;
  padding: 28px 24px 24px;
  border-radius: 20px;
  overflow: hidden;
  color: var(--color-on-primary);
  background: linear-gradient(
    140deg,
    var(--color-primary-container) 0%,
    var(--color-primary-gradient) 100%
  );
  box-shadow: var(--shadow-lg);
}

.welcome::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.06) 0 30%, transparent 60%),
    radial-gradient(circle at 10% 90%, rgba(219, 121, 10, 0.15) 0 25%, transparent 55%);
}

.welcome-text {
  position: relative;
}

.welcome-sub {
  font-size: 11px;
  color: var(--color-on-primary-soft);
  letter-spacing: 0.02em;
}

.welcome-title {
  margin-top: 10px;
  font-size: 23px;
  line-height: 1.4;
  letter-spacing: -0.8px;
}

.welcome-deco {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.deco-gate {
  width: 72px;
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.deco-dots {
  display: flex;
  gap: 5px;
}
.deco-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.8;
}
.deco-dots span:nth-child(2) {
  opacity: 0.5;
}
.deco-dots span:nth-child(3) {
  opacity: 0.3;
}

/* ── 섹션 라벨 ── */
.section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.section-label svg {
  width: 13px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

/* ── 여행 현황 ── */
.trip-status {
  margin-top: 24px;
}

/* 진행 중 카드 */
.active-card {
  display: block;
  padding: 20px 22px;
  border-radius: 18px;
  background: linear-gradient(
    150deg,
    var(--color-primary-container) 0%,
    var(--color-primary-gradient) 100%
  );
  box-shadow: var(--shadow-lg);
  color: var(--color-on-primary);
  text-decoration: none;
  transition: filter var(--transition);
}
.active-card:hover {
  filter: brightness(1.06);
}

.active-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(219, 121, 10, 0.85);
  font-size: 11px;
  font-weight: 700;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.6s ease infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.75);
  }
}

.active-date {
  font-size: 12px;
  color: var(--color-on-primary-meta);
}

.active-title {
  margin-top: 14px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.3;
}

.active-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.active-visits {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-on-primary-meta);
  font-size: 12px;
}
.active-visits svg {
  width: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.active-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 12px;
  font-weight: 600;
}
.active-cta svg {
  width: 13px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

/* 주변 문화재 */
.nearby-section {
  margin-top: 12px;
}

.nearby-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 600;
}
.nearby-label svg {
  width: 12px;
  fill: none;
  stroke: var(--color-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.nearby-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  padding: 0;
}

.nearby-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 12px;
  background: var(--color-surface-lowest);
  text-decoration: none;
  color: var(--color-text-base);
  transition: background var(--transition);
}
.nearby-item:hover {
  background: var(--color-surface-low);
}

.nearby-thumb {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.nearby-thumb-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: var(--color-surface-highest);
  flex-shrink: 0;
}

.nearby-info {
  flex: 1;
  min-width: 0;
}
.nearby-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nearby-dist {
  font-size: 11px;
  color: var(--color-text-muted);
}

.nearby-arrow {
  width: 14px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--color-outline-variant);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.nearby-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px;
  border: 1px dashed var(--color-outline-variant);
  border-radius: 12px;
  text-align: center;
}
.nearby-placeholder svg {
  width: 26px;
  fill: none;
  stroke: var(--color-outline-variant);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}
.nearby-placeholder p {
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.nearby-empty {
  color: var(--color-text-muted);
  font-size: 12px;
  padding: 8px 0;
}

/* 새 여행 시작 카드 */
.start-card {
  position: relative;
  display: block;
  min-height: 164px;
  padding: 24px 22px;
  border: 1px solid var(--color-surface-warm-border);
  border-radius: 18px;
  overflow: hidden;
  background: var(--color-surface-warm);
  text-decoration: none;
  transition: filter var(--transition);
}
.start-card:hover {
  filter: brightness(0.97);
}

.start-text {
  position: relative;
  z-index: 1;
  max-width: 200px;
}

.start-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  background: var(--color-accent);
  color: var(--color-on-primary);
  font-size: 10px;
  font-weight: 700;
}

.start-text h2 {
  margin-top: 10px;
  color: var(--color-primary-container);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.5px;
}
.start-text p {
  margin-top: 8px;
  color: var(--color-on-surface-variant);
  font-size: 11px;
  line-height: 1.5;
}

.landmark {
  position: absolute;
  width: 128px;
  right: -6px;
  bottom: -8px;
  fill: none;
  stroke: var(--color-surface-warm-border);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.5;
  opacity: 0.6;
}

/* ── 여행 기록 섹션 ── */
.record-section {
  margin-top: 28px;
}

/* 최근 완료 여행 카드 */
.recent-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 18px;
  background: var(--color-surface-lowest);
  text-decoration: none;
  color: var(--color-text-base);
  transition: background var(--transition);
}
.recent-card:hover {
  background: var(--color-surface-low);
}

.recent-thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 96px;
}

.recent-thumb {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
}

.recent-thumb-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  place-items: center;
  background: linear-gradient(
    140deg,
    var(--color-surface-high) 0%,
    var(--color-surface-highest) 100%
  );
}
.recent-thumb-placeholder svg {
  width: 36px;
  fill: none;
  stroke: var(--color-outline-variant);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.days-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 10px;
  font-weight: 700;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.recent-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.recent-title {
  margin-top: 5px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary-container);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-meta {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 11px;
}
.recent-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.recent-meta svg {
  width: 11px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.recent-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 700;
}
.recent-cta svg {
  width: 12px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

/* 서비스 가이드 */
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 18px;
  background: var(--color-surface-lowest);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}

.retry-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition);
}
.retry-btn:hover {
  opacity: 0.85;
}

.guide-card {
  padding: 22px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 18px;
  background: var(--color-surface-lowest);
}

.guide-title {
  margin-bottom: 18px;
  color: var(--color-primary-container);
  font-size: 14px;
  font-weight: 700;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  padding: 0;
}
.guide-list li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.guide-num {
  display: grid;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  place-items: center;
  flex-shrink: 0;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 11px;
  font-weight: 700;
}

.guide-list strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary-container);
}
.guide-list p {
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

/* 스켈레톤 */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 14px;
}
.sk-card {
  height: 130px;
}
.sk-nearby {
  height: 62px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 360px) {
  .main-page {
    padding-inline: 14px;
  }
  .welcome {
    padding-inline: 20px;
  }
}
</style>
