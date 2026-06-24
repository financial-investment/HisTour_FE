<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { tripApi } from '@/api/tripApi'
import { heritageApi } from '@/api/heritageApi'
import type { TripResponse, RecommendedHeritage } from '@/types/api'
import TripHistoryCard from '@/components/common/TripHistoryCard.vue'
import MainTopBar from './components/MainTopBar.vue'
import MainWelcomeBanner from './components/MainWelcomeBanner.vue'
import MainActiveTripCard from './components/MainActiveTripCard.vue'
import MainStartCard from './components/MainStartCard.vue'
import MainGuideCard from './components/MainGuideCard.vue'

const router = useRouter()
const userStore = useUserStore()
const isLoggingOut = ref(false)
const trips = ref<TripResponse[]>([])
const isLoadingTrips = ref(false)
const nearbyHeritages = ref<RecommendedHeritage[]>([])
const isLoadingNearby = ref(false)
const nearbyError = ref<'geo' | 'empty' | null>(null)
const completedTripThumb = ref<string | null>(null)
const completedTripFallbackThumb = ref<string | null>(null)
const tripsError = ref(false)

const activeTrip = computed(() => trips.value.find((t) => t.status === 'IN_PROGRESS') ?? null)
const latestCompletedTrip = computed(
  () => trips.value.find((t) => t.status === 'COMPLETED') ?? null,
)

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
    const heritage = await heritageApi.getDetail(firstLog.heritageId)
    completedTripFallbackThumb.value = heritage.thumbnailUrl
    if (firstLog.photoUrl) {
      completedTripThumb.value = firstLog.photoUrl
      return
    }
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
</script>

<template>
  <main class="main-page">
    <MainTopBar :is-logging-out="isLoggingOut" @logout="handleLogout" />

    <MainWelcomeBanner :nickname="userStore.user?.nickname" />

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

      <MainActiveTripCard
        v-else-if="activeTrip"
        :trip="activeTrip"
        :nearby-heritages="nearbyHeritages"
        :is-loading-nearby="isLoadingNearby"
        :nearby-error="nearbyError"
      />

      <MainStartCard v-else />
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

      <TripHistoryCard
        v-if="latestCompletedTrip"
        :trip="latestCompletedTrip"
        :thumb="completedTripThumb"
        :fallback-thumb="completedTripFallbackThumb"
        label="가장 최근 여행"
      />

      <div v-else-if="tripsError" class="error-card">
        <p>여행 목록을 불러오지 못했어요.</p>
        <button class="retry-btn" @click="loadTrips">다시 시도</button>
      </div>

      <MainGuideCard v-else-if="!isLoadingTrips" />
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

.trip-status {
  margin-top: 24px;
}

.record-section {
  margin-top: 28px;
}

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
}
</style>
