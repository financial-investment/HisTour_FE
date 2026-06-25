<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { type CarouselItem } from '@/components/common/ImageCarousel.vue'
import { reportApi } from '@/api/reportApi'
import { quizApi } from '@/api/quizApi'
import { tripApi } from '@/api/tripApi'
import type { QuizResultResponse, ReportResponse, VisitLogResponse } from '@/types/api'
import ReportHero from './components/ReportHero.vue'
import ReportNarrative from './components/ReportNarrative.vue'
import ReportVisitedSection from './components/ReportVisitedSection.vue'
import ReportCourseSection from './components/ReportCourseSection.vue'
import ReportQuizCta from './components/ReportQuizCta.vue'

const route = useRoute()
const router = useRouter()

const report = ref<ReportResponse | null>(null)
const quizResult = ref<QuizResultResponse | null>(null)
const visitLogs = ref<VisitLogResponse[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const tripId = computed(() => Number(route.params.tripId))
const visitedHeritages = computed(() => report.value?.visitedHeritages ?? [])
const visitLogByHeritageId = computed(() => {
  const map = new Map<number, VisitLogResponse>()
  visitLogs.value.forEach((log) => { if (!map.has(log.heritageId)) map.set(log.heritageId, log) })
  return map
})

const reportTitle = computed(() => {
  const first = visitedHeritages.value[0]?.name
  return first ? `${first}에서 시작된 역사 여정` : '여행 리포트'
})

const summaryParagraphs = computed(() => {
  const summary = report.value?.summary?.trim()
  if (!summary && visitedHeritages.value.length) {
    return [
      `이번 여행에서는 ${visitedHeritages.value.map((h) => h.name).join(', ')}을 둘러봤습니다.`,
      '각 유적지에서 남긴 기록을 바탕으로 여행의 흐름과 인상 깊었던 역사적 장면을 정리했습니다.',
    ]
  }
  if (!summary) return ['이번 여행의 방문 기록을 바탕으로 역사적 흐름을 정리했습니다.']
  return summary.split(/\n{2,}|\r?\n/).map((l) => l.trim()).filter(Boolean)
})

const courseTitle = computed(() => {
  const course = report.value?.course
  return course ? `${course.regionName} 추천 코스` : '추천 코스 준비 중'
})

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

async function loadSubmittedQuizResult() {
  try {
    return await quizApi.getResults(tripId.value)
  } catch {
    return null
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response
    return res?.data?.message || fallback
  }
  return fallback
}
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
      <ReportHero :title="reportTitle" :visit-count="visitedHeritages.length" />

      <ReportNarrative
        :thumbnail-url="visitedHeritages[0]?.thumbnailUrl ?? null"
        :thumbnail-alt="visitedHeritages[0]?.name ?? ''"
        :paragraphs="summaryParagraphs"
      />

      <ReportVisitedSection :items="visitedCarouselItems" />

      <ReportCourseSection
        :visited-logs="visitLogs"
        :course-heritages="report.course?.heritages ?? []"
        :course-title="courseTitle"
        :course-region-name="report.course?.regionName"
      />

      <ReportQuizCta :trip-id="report.tripId" :quiz-result="quizResult" />
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

.brand-lockup strong {
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.report-topbar button {
  color: #031632;
  font-size: 28px;
}

.message-panel {
  padding: 22px;
  border: 1px solid #c5c6ce;
  border-radius: 4px;
  background: #fff;
}

.message-panel strong {
  color: #031632;
  font-size: 18px;
}

.message-panel p {
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
</style>
