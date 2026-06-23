<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { reportApi } from '@/api/reportApi'
import { quizApi } from '@/api/quizApi'
import type { CourseHeritage, QuizResultResponse, ReportResponse, VisitedHeritage } from '@/types/api'

const route = useRoute()
const router = useRouter()

const report = ref<ReportResponse | null>(null)
const quizResult = ref<QuizResultResponse | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const tripId = computed(() => Number(route.params.tripId))
const visitedHeritages = computed(() => report.value?.visitedHeritages ?? [])
const courseHeritages = computed(() => report.value?.course?.heritages ?? [])
const summaryParagraphs = computed(() => {
  const summary = report.value?.summary?.trim()
  if (!summary) return ['이번 여행의 방문 기록을 바탕으로 역사적 흐름을 정리했습니다.']
  return summary
    .split(/\n{2,}|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
})
const reportSerial = computed(() => {
  if (!report.value) return 'REC-0000'
  return `REC-${String(report.value.tripId).padStart(4, '0')}`
})
const reportTitle = computed(() => {
  const first = visitedHeritages.value[0]?.name
  if (!first) return 'Archived Journey Report'
  return `${first}에서 시작된 역사 여정`
})
const courseTitle = computed(() => {
  const course = report.value?.course
  if (!course) return '추천 코스 준비 중'
  return `${course.regionName} 추천 코스`
})
const quizResultMessage = computed(() => {
  const accuracy = quizResult.value?.accuracy ?? 0
  if (accuracy >= 80) return 'Strong recall from this journey'
  if (accuracy >= 50) return 'Good review checkpoint'
  return 'Review recommended'
})

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
    report.value = await reportApi.get(tripId.value)
    quizResult.value = await loadSubmittedQuizResult()
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '여행 리포트를 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function getVisitedLabel(index: number) {
  return `VISIT ${String(index + 1).padStart(2, '0')}`
}

function getCourseNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function getFallbackInitial(name: string) {
  return name.trim().slice(0, 1) || 'H'
}

function openHeritage(heritage: VisitedHeritage | CourseHeritage) {
  router.push(`/heritage/${heritage.heritageId}`)
}

async function loadSubmittedQuizResult() {
  try {
    return await quizApi.getResults(tripId.value)
  } catch (error: unknown) {
    if (getResponseStatus(error) === 404) {
      return null
    }
    throw error
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

function getResponseStatus(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response
  ) {
    return error.response.status
  }
  return undefined
}
</script>

<template>
  <main class="report-page">
    <header class="report-topbar">
      <div class="brand-lockup">
        <span class="brand-avatar">H</span>
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
          <span>Official Report</span>
          <i></i>
          <small>{{ reportSerial }}</small>
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
            :src="visitedHeritages[0].thumbnailUrl"
            :alt="visitedHeritages[0].name"
          />
          <div v-else class="image-fallback">HisTour</div>
          <span>CURATED BY AI-HISTORIAN</span>
        </div>

        <article class="narrative-copy">
          <div class="section-kicker">
            <span>✦</span>
            <h2>Narrative Reconstruction</h2>
          </div>
          <p v-for="paragraph in summaryParagraphs" :key="paragraph">{{ paragraph }}</p>
        </article>
      </section>

      <section class="records-section">
        <div class="section-heading">
          <div>
            <h2>Archived Records</h2>
            <p>VERIFIED LOCATIONS VISITED</p>
          </div>
          <RouterLink to="/trip">VIEW ALL →</RouterLink>
        </div>

        <div v-if="visitedHeritages.length" class="record-scroll">
          <button
            v-for="(heritage, index) in visitedHeritages"
            :key="heritage.heritageId"
            class="record-card"
            type="button"
            @click="openHeritage(heritage)"
          >
            <div class="record-image">
              <img v-if="heritage.thumbnailUrl" :src="heritage.thumbnailUrl" :alt="heritage.name" />
              <span v-else>{{ getFallbackInitial(heritage.name) }}</span>
              <small>{{ getVisitedLabel(index) }}</small>
            </div>
            <span>Heritage Archive</span>
            <strong>{{ heritage.name }}</strong>
          </button>
        </div>

        <div v-else class="empty-panel">
          <strong>방문 기록이 비어 있어요</strong>
          <p>완료된 여행의 방문 문화재가 있으면 리포트에 아카이브 카드로 표시됩니다.</p>
        </div>
      </section>

      <section class="course-section">
        <div class="course-map">
          <div
            v-for="(heritage, index) in courseHeritages.slice(0, 3)"
            :key="heritage.heritageId"
            class="map-pin"
            :style="{
              left: `${24 + index * 24}%`,
              top: `${28 + (index % 2) * 24}%`,
            }"
          >
            {{ index + 1 }}
          </div>
        </div>

        <div class="course-copy">
          <span>Recommended Sequence</span>
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
        <h2>Knowledge Verification</h2>
        <template v-if="quizResult">
          <div class="quiz-result-card">
            <span>{{ quizResultMessage }}</span>
            <strong>{{ quizResult.correctCount }}/{{ quizResult.totalCount }}</strong>
            <small>{{ quizResult.accuracy }}% accuracy</small>
          </div>
          <RouterLink class="result-link" :to="`/quiz/${report.tripId}`">View Quiz Result</RouterLink>
        </template>
        <p>여행 후 퀴즈로 방금 정리한 기록을 오래 남겨보세요.</p>
        <RouterLink :to="`/quiz/${report.tripId}`">Start Quiz</RouterLink>
      </section>
    </template>
  </main>

  <LoadingOverlay v-if="isLoading" message="여행 리포트를 불러오고 있어요" />
</template>

<style scoped>
.report-page {
  min-height: 100dvh;
  padding: 80px 16px 110px;
  color: #121c28;
  background: #f8f9ff;
}

.report-topbar {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 10;
  display: flex;
  width: 100%;
  max-width: var(--mobile-max-width);
  height: 64px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #c5c6ce;
  background: #f8f9ff;
  transform: translateX(-50%);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  border: 1px solid #c5c6ce;
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #1a2b48, #d97706);
  font-size: 12px;
  font-weight: 800;
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
.record-card,
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

.section-heading a {
  color: #031632;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.record-scroll {
  display: flex;
  gap: 16px;
  margin: 0 -16px;
  overflow-x: auto;
  padding: 0 16px 8px;
  scrollbar-width: none;
}

.record-scroll::-webkit-scrollbar {
  display: none;
}

.record-card {
  flex: 0 0 210px;
  padding: 12px;
  color: inherit;
  text-align: left;
}

.record-image {
  position: relative;
  aspect-ratio: 4 / 3;
  margin-bottom: 12px;
  overflow: hidden;
  background: #eef4ff;
}

.record-image img,
.record-image > span {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-image > span {
  display: grid;
  place-items: center;
  color: #8293b5;
  font-size: 36px;
  font-weight: 800;
}

.record-image small {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 7px;
  color: #fff;
  background: rgba(3, 22, 50, 0.92);
  font-size: 9px;
  font-weight: 800;
}

.record-card > span {
  color: #5c5f60;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-card strong {
  display: block;
  margin-top: 4px;
  color: #031632;
  font-size: 16px;
}

.empty-panel {
  padding: 18px;
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
  background:
    linear-gradient(135deg, rgba(3, 22, 50, 0.08) 25%, transparent 25%) 0 0 / 42px 42px,
    linear-gradient(45deg, transparent 48%, rgba(3, 22, 50, 0.28) 48% 51%, transparent 51%),
    #d9e3f4;
}

.map-pin {
  position: absolute;
  display: grid;
  width: 34px;
  height: 34px;
  border: 3px solid #fff;
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: #031632;
  font-weight: 900;
  box-shadow: 0 6px 16px rgba(3, 22, 50, 0.22);
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
