<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { tripApi } from '@/api/tripApi'
import { heritageApi } from '@/api/heritageApi'
import { useToast } from '@/composables/useToast'
import type { TripResponse, VisitLogResponse, HeritageCategoryStats } from '@/types/api'
import MyProfileHeader from './components/MyProfileHeader.vue'
import MyPeriodChart from './components/MyPeriodChart.vue'
import MyVisitGallery from './components/MyVisitGallery.vue'
import MyCategoryProgress from './components/MyCategoryProgress.vue'
import TripHistoryCard from '@/components/common/TripHistoryCard.vue'

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

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const trips = ref<TripResponse[]>([])
const isLoading = ref(false)
const isLoggingOut = ref(false)
const tripDetailMap = ref<
  Record<number, { thumb: string | null; fallbackThumb: string | null; logs: VisitLogResponse[] }>
>({})
const isLoadingDetails = ref(false)
const periodCounts = ref<{ label: string; count: number }[]>([])
const isLoadingPeriods = ref(false)
const categoryTotals = ref<HeritageCategoryStats[]>([])
const visitedByCategory = ref<Record<string, number>>({})
const isLoadingCategory = ref(false)

const completedTrips = computed(() =>
  trips.value
    .filter((t) => t.status === 'COMPLETED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
)

const totalVisits = computed(() => trips.value.reduce((sum, t) => sum + t.visitCount, 0))

const avgVisits = computed(() => {
  if (completedTrips.value.length === 0) return '0'
  const total = completedTrips.value.reduce((sum, t) => sum + t.visitCount, 0)
  return (total / completedTrips.value.length).toFixed(1)
})

const allVisitLogs = computed(() =>
  trips.value
    .flatMap((t) => tripDetailMap.value[t.tripId]?.logs ?? [])
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()),
)

const categoryItems = computed(() =>
  categoryTotals.value
    .map((s) => ({
      category: s.category,
      visited: visitedByCategory.value[s.category] ?? 0,
      total: s.total,
    }))
    .sort((a, b) => b.visited - a.visited || b.total - a.total)
    .slice(0, 6),
)

async function loadTripDetails() {
  if (trips.value.length === 0) return
  isLoadingDetails.value = true

  const map: Record<
    number,
    { thumb: string | null; fallbackThumb: string | null; logs: VisitLogResponse[] }
  > = {}
  await Promise.all(
    trips.value.map(async (trip) => {
      try {
        const detail = await tripApi.getDetail(trip.tripId)
        const firstLog = detail.visitLogs[0]
        const fallbackThumb = firstLog?.heritageThumbnailUrl ?? null
        const thumb = detail.visitLogs.find((l) => l.photoUrl)?.photoUrl ?? fallbackThumb
        map[trip.tripId] = { thumb, fallbackThumb, logs: detail.visitLogs }
      } catch {
        map[trip.tripId] = { thumb: null, fallbackThumb: null, logs: [] }
      }
    }),
  )
  tripDetailMap.value = map
  isLoadingDetails.value = false

  loadHeritageStats()
}

async function loadHeritageStats() {
  const allLogs = trips.value.flatMap((t) => tripDetailMap.value[t.tripId]?.logs ?? [])
  const uniqueIds = [...new Set(allLogs.map((l) => l.heritageId))]
  if (uniqueIds.length === 0) return

  isLoadingPeriods.value = true
  const periodCts: Record<string, number> = {}
  const categoryCts: Record<string, number> = {}

  await Promise.all(
    uniqueIds.map(async (heritageId) => {
      try {
        const h = await heritageApi.getDetail(heritageId)
        const period = h.period ?? 'UNKNOWN'
        periodCts[period] = (periodCts[period] ?? 0) + 1
        if (h.category) categoryCts[h.category] = (categoryCts[h.category] ?? 0) + 1
      } catch {
        // 조용히 실패
      }
    }),
  )

  periodCounts.value = Object.entries(periodCts)
    .map(([period, count]) => ({ label: PERIOD_NAMES[period] ?? period, count }))
    .sort((a, b) => b.count - a.count)
  visitedByCategory.value = categoryCts
  isLoadingPeriods.value = false
}

async function loadCategoryTotals() {
  isLoadingCategory.value = true
  try {
    categoryTotals.value = await heritageApi.getCategoryStats()
  } catch {
    // 조용히 실패
  } finally {
    isLoadingCategory.value = false
  }
}

onMounted(async () => {
  try {
    if (!userStore.user) await userStore.loadProfile()
  } catch {
    /* 조용히 실패 */
  }
  isLoading.value = true
  try {
    trips.value = await tripApi.list()
    loadTripDetails()
    loadCategoryTotals()
  } catch {
    toast.error('여행 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    isLoading.value = false
  }
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
  <main class="mypage">
    <MyProfileHeader
      :nickname="userStore.user?.nickname ?? '여행자'"
      :email="userStore.user?.email"
      :completed-count="completedTrips.length"
      :total-visits="totalVisits"
      :avg-visits="avgVisits"
      :is-logging-out="isLoggingOut"
      @logout="handleLogout"
    />

    <template v-if="completedTrips.length > 0 || isLoading">
      <MyPeriodChart :periods="periodCounts" :is-loading="isLoadingDetails || isLoadingPeriods" />
      <MyCategoryProgress
        :items="categoryItems"
        :is-loading="isLoadingCategory || isLoadingPeriods"
        class="section-gap"
      />
      <MyVisitGallery :logs="allVisitLogs" :is-loading="isLoadingDetails" />
    </template>

    <!-- 지난 여행 -->
    <section class="trips-section">
      <p class="section-label">
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
          <path d="M4 1.5v2M10 1.5v2M1.5 6h11" />
        </svg>
        지난 여행
      </p>

      <template v-if="isLoading">
        <div v-for="i in 3" :key="i" class="trip-skeleton"></div>
      </template>

      <template v-else-if="completedTrips.length > 0">
        <TripHistoryCard
          v-for="trip in completedTrips"
          :key="trip.tripId"
          :trip="trip"
          :thumb="tripDetailMap[trip.tripId]?.thumb"
          :fallback-thumb="tripDetailMap[trip.tripId]?.fallbackThumb"
          class="trip-card-gap"
        />
      </template>

      <div v-else class="empty-state">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10 44h28M13 36h22M17 32V18h14v14M12 18h24L24 6 12 18Z" />
          <path d="M20 23v7M24 23v7M28 23v7" />
        </svg>
        <p>아직 완료한 여행이 없어요.</p>
        <RouterLink to="/" class="start-link">여행 시작하기 →</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.mypage {
  width: min(100%, var(--mobile-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  padding-bottom: 96px;
  background: var(--color-bg);
}

.section-gap {
  margin-top: 24px;
}

.trips-section {
  padding: 24px 20px 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-outline);
}
.section-label svg {
  width: 13px;
}

.trip-skeleton {
  height: 120px;
  margin-bottom: 10px;
  border-radius: 18px;
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.trip-card-gap {
  margin-bottom: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 52px 20px;
  text-align: center;
}
.empty-state svg {
  width: 52px;
  color: var(--color-outline-variant);
}
.empty-state p {
  font-size: 14px;
  color: var(--color-outline);
}

.start-link {
  padding: 10px 22px;
  border-radius: 10px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity var(--transition);
}
.start-link:hover {
  opacity: 0.85;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
