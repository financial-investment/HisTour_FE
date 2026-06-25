<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { heritageApi } from '@/api/heritageApi'
import { tripApi } from '@/api/tripApi'
import { useToast } from '@/composables/useToast'
import { getCurrentCoordinates, watchCoordinates, type Coordinates } from '@/composables/useGeolocation'
import type { RecommendedHeritage, TripDetailResponse, TripResponse } from '@/types/api'
import TripActiveHeader from './components/TripActiveHeader.vue'
import TripCompleteDialog from './components/TripCompleteDialog.vue'
import TripCreatePanel from './components/TripCreatePanel.vue'
import TripMapSection from './components/TripMapSection.vue'
import TripRecommendationSection from './components/TripRecommendationSection.vue'
import TripVisitedSection from './components/TripVisitedSection.vue'

const router = useRouter()
const toast = useToast()
const trips = ref<TripResponse[]>([])
const activeTrip = ref<TripDetailResponse | null>(null)
const recommendations = ref<RecommendedHeritage[]>([])
const selectedHeritage = ref<RecommendedHeritage | null>(null)
const coordinates = ref<Coordinates | null>(null)
const heritageLocations = ref<Record<number, { lat: number; lng: number }>>({})
const mapSection = ref<InstanceType<typeof TripMapSection> | null>(null)
const title = ref('')
const tripDate = ref(new Date().toISOString().slice(0, 10))
let stopLocationWatch: (() => void) | null = null
const isLoading = ref(true)
const isSubmitting = ref(false)
const isCompleting = ref(false)
const isLoadingRecommendations = ref(false)
const showCompleteDialog = ref(false)
const errorMessage = ref('')

const hasActiveTrip = computed(() => Boolean(activeTrip.value))
const visitedLogs = computed(() => activeTrip.value?.visitLogs ?? [])
const mapVisitedLogs = computed(() =>
  visitedLogs.value.map((log) => {
    const heritageLocation = heritageLocations.value[log.heritageId]
    if (!heritageLocation) return log
    return { ...log, lat: heritageLocation.lat, lng: heritageLocation.lng }
  }),
)

async function renderTripMap() {
  await nextTick()
  await mapSection.value?.renderMap()
}

async function loadVisitedHeritageLocations() {
  const missingHeritageIds = [
    ...new Set(
      visitedLogs.value
        .map((log) => log.heritageId)
        .filter((heritageId) => !heritageLocations.value[heritageId]),
    ),
  ]

  if (!missingHeritageIds.length) return

  const loadedLocations = await Promise.all(
    missingHeritageIds.map(async (heritageId) => {
      try {
        const heritage = await heritageApi.getDetail(heritageId)
        return [heritageId, { lat: heritage.lat, lng: heritage.lng }] as const
      } catch {
        return null
      }
    }),
  )

  heritageLocations.value = {
    ...heritageLocations.value,
    ...Object.fromEntries(loadedLocations.filter((location) => location !== null)),
  }
}

async function loadTrips() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    trips.value = await tripApi.list()
    const current = trips.value.find((trip) => trip.status === 'IN_PROGRESS')
    if (current) {
      activeTrip.value = await tripApi.getDetail(current.tripId)
      await loadVisitedHeritageLocations()
      coordinates.value = await getCurrentCoordinates()
    }
  } catch {
    errorMessage.value = '여행 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }

  if (!activeTrip.value || !coordinates.value) return

  await renderTripMap()
  await loadRecommendations()

  stopLocationWatch?.()
  stopLocationWatch = watchCoordinates((coords) => {
    coordinates.value = coords
  })
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
    await loadVisitedHeritageLocations()
    coordinates.value = await getCurrentCoordinates()
    await loadRecommendations()
    await renderTripMap()
    stopLocationWatch?.()
    stopLocationWatch = watchCoordinates((coords) => {
      coordinates.value = coords
    })
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
    recommendations.value = result.filter(
      (heritage) => !visitedHeritageIds.has(heritage.heritageId),
    )
    selectedHeritage.value = recommendations.value[0] ?? null
  } catch (error) {
    console.error('[TripPage] recommendNext 실패:', error)
    recommendations.value = []
    selectedHeritage.value = null
    errorMessage.value = '주변 문화유산을 불러오지 못했어요.'
  } finally {
    isLoadingRecommendations.value = false
  }
}

function handleRecommendationSelect(heritage: RecommendedHeritage) {
  selectedHeritage.value = heritage
  mapSection.value?.panTo(heritage.lat, heritage.lng)
}

async function refreshNearbyHeritages() {
  if (isLoadingRecommendations.value) return
  errorMessage.value = ''
  coordinates.value = await getCurrentCoordinates()
  await loadRecommendations()
  await renderTripMap()
}

function requestCompleteTrip() {
  if (!visitedLogs.value.length) {
    toast.info('최소 1개 이상의 문화재를 방문해야 여행을 종료할 수 있어요.')
    return
  }
  showCompleteDialog.value = true
}

async function completeTrip() {
  if (!activeTrip.value || isCompleting.value || !visitedLogs.value.length) return
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

onBeforeUnmount(() => stopLocationWatch?.())
onMounted(loadTrips)
</script>

<template>
  <section v-if="isLoading" class="state-page" aria-live="polite">
    <span class="loader" />
    <p>여행 기록을 펼치는 중...</p>
  </section>

  <TripCreatePanel
    v-else-if="!hasActiveTrip"
    v-model:title="title"
    v-model:trip-date="tripDate"
    :is-submitting="isSubmitting"
    :error-message="errorMessage"
    @submit="createTrip"
  />

  <main v-else-if="activeTrip" class="active-trip-page">
    <TripActiveHeader
      :active-trip="activeTrip"
      :visited-count="visitedLogs.length"
      @complete="requestCompleteTrip"
    />

    <TripMapSection
      ref="mapSection"
      v-model:selected-heritage="selectedHeritage"
      :coordinates="coordinates"
      :recommendations="recommendations"
      :visited-logs="mapVisitedLogs"
      :is-loading-recommendations="isLoadingRecommendations"
      @refresh="refreshNearbyHeritages"
    />

    <TripRecommendationSection
      :trip-id="activeTrip.tripId"
      :recommendations="recommendations"
      :selected-heritage="selectedHeritage"
      :is-loading="isLoadingRecommendations"
      @select="handleRecommendationSelect"
    />

    <TripVisitedSection :logs="visitedLogs" :error-message="errorMessage" />
  </main>

  <Teleport to="body">
    <TripCompleteDialog
      v-if="showCompleteDialog && activeTrip"
      :active-trip="activeTrip"
      :visited-count="visitedLogs.length"
      :is-completing="isCompleting"
      @close="showCompleteDialog = false"
      @complete="completeTrip"
    />
  </Teleport>
</template>

<style scoped>
.state-page {
  min-height: calc(100dvh - 60px);
  display: grid;
  place-content: center;
  gap: 14px;
  text-align: center;
  color: var(--color-on-surface-variant);
}
.loader {
  width: 36px;
  height: 36px;
  margin: auto;
  border: 3px solid #d8e0ec;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.active-trip-page {
  min-height: calc(100dvh - 60px);
  background: #f8f9ff;
  color: #14233a;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
