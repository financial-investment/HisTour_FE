<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { quizApi, type QuizAnswerSubmitRequest } from '@/api/quizApi'
import { tripApi } from '@/api/tripApi'
import type {
  QuizChoiceResponse,
  QuizQuestionResponse,
  QuizResultItemResponse,
  QuizResultResponse,
  QuizSessionResponse,
  TripResponse,
} from '@/types/api'

const route = useRoute()
const router = useRouter()

const session = ref<QuizSessionResponse | null>(null)
const result = ref<QuizResultResponse | null>(null)
const selectedChoiceIds = ref<Record<number, number>>({})
const currentIndex = ref(0)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const trips = ref<TripResponse[]>([])
const openResultId = ref<number | null>(null)

const tripId = computed(() => {
  const rawTripId = route.params.tripId
  const value = Array.isArray(rawTripId) ? rawTripId[0] : rawTripId
  return value ? Number(value) : null
})
const isQuizIndex = computed(() => tripId.value === null)
const completedTrips = computed(() => trips.value.filter((trip) => trip.status === 'COMPLETED'))
const questions = computed(() => session.value?.questions ?? [])
const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
const totalCount = computed(() => session.value?.totalCount ?? questions.value.length)
const answeredCount = computed(() => Object.keys(selectedChoiceIds.value).length)
const hasAnsweredAll = computed(() => {
  return questions.value.length > 0 && questions.value.every((q) => selectedChoiceIds.value[q.sessionId])
})
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round(((currentIndex.value + 1) / totalCount.value) * 100)
})
const resultBySessionId = computed(() => {
  return new Map(result.value?.results.map((item) => [item.sessionId, item]) ?? [])
})
const resultEntries = computed(() => {
  return questions.value.map((question, index) => ({
    question,
    index,
    result: resultBySessionId.value.get(question.sessionId),
  }))
})
const scoreStrokeOffset = computed(() => {
  const accuracy = result.value?.accuracy ?? 0
  const circumference = 2 * Math.PI * 80
  return circumference - (accuracy / 100) * circumference
})

onMounted(() => {
  if (tripId.value) {
    loadQuiz()
  } else {
    loadTrips()
  }
})

async function loadTrips() {
  try {
    isLoading.value = true
    errorMessage.value = ''
    trips.value = await tripApi.list()
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '여행 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

async function loadQuiz() {
  if (!tripId.value || !Number.isFinite(tripId.value) || tripId.value <= 0) {
    errorMessage.value = '퀴즈를 불러올 여행 정보가 올바르지 않습니다.'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    try {
      session.value = await quizApi.getSession(tripId.value)
    } catch (error: unknown) {
      if (getResponseStatus(error) === 404) {
        session.value = await quizApi.createSession(tripId.value)
      } else {
        throw error
      }
    }
    await restoreSubmittedResult()
    currentIndex.value = 0
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '퀴즈를 준비하지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function selectChoice(question: QuizQuestionResponse, choice: QuizChoiceResponse) {
  if (result.value || isSubmitting.value) return
  selectedChoiceIds.value = {
    ...selectedChoiceIds.value,
    [question.sessionId]: choice.choiceId,
  }
}

function goPrevious() {
  currentIndex.value = Math.max(currentIndex.value - 1, 0)
}

function goNext() {
  currentIndex.value = Math.min(currentIndex.value + 1, questions.value.length - 1)
}

async function submitQuiz() {
  if (!hasAnsweredAll.value || isSubmitting.value) return

  const answers: QuizAnswerSubmitRequest[] = questions.value.map((question) => ({
    sessionId: question.sessionId,
    choiceId: selectedChoiceIds.value[question.sessionId] as number,
  }))

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    result.value = await quizApi.submitResults(answers)
    openResultId.value = result.value.results[0]?.sessionId ?? null
    currentIndex.value = 0
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '답안을 제출하지 못했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

async function restoreSubmittedResult() {
  if (!tripId.value) return

  let submittedResult: QuizResultResponse | null = null
  try {
    submittedResult = await quizApi.getResults(tripId.value)
  } catch {
    return
  }

  if (!submittedResult) return

  result.value = submittedResult
  selectedChoiceIds.value = submittedResult.results.reduce<Record<number, number>>((answers, item) => {
    answers[item.sessionId] = item.selectedChoiceId
    return answers
  }, {})
  openResultId.value = submittedResult.results[0]?.sessionId ?? null
}

function getTripId(trip: TripResponse) {
  return trip.tripId
}

function formatTripTitle(trip: TripResponse) {
  return trip.title || `${formatDate(trip.tripDate || trip.createdAt)} 여행`
}

function formatDate(value: string | null) {
  if (!value) return '날짜 미정'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getChoiceContent(question: QuizQuestionResponse, choiceId: number) {
  return question.choices.find((choice) => choice.choiceId === choiceId)?.content ?? ''
}

function getDifficultyLabel(difficulty: string) {
  const labels: Record<string, string> = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
  }
  return labels[difficulty] ?? difficulty
}

function toggleResult(sessionId: number) {
  openResultId.value = openResultId.value === sessionId ? null : sessionId
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
  <main class="quiz-page" :class="{ result: Boolean(result) }">
    <header class="quiz-header">
      <button type="button" aria-label="뒤로 가기" @click="router.back()">×</button>
      <strong>HisTour</strong>
      <div v-if="!result" class="session-meter">
        <span>QUIZ SESSION</span>
        <i><b :style="{ width: `${progressPercent}%` }"></b></i>
      </div>
      <RouterLink v-else to="/" aria-label="홈으로 이동">⌂</RouterLink>
    </header>

    <section v-if="isQuizIndex && !errorMessage" class="quiz-index">
      <div class="index-title">
        <span>ARCHIVAL QUIZ</span>
        <h1>완료한 여행을 선택하세요</h1>
        <p>다녀온 장소를 기반으로 기억을 점검합니다.</p>
      </div>

      <div v-if="completedTrips.length" class="trip-list">
        <RouterLink
          v-for="trip in completedTrips"
          :key="getTripId(trip)"
          class="trip-card"
          :to="`/quiz/${getTripId(trip)}`"
        >
          <div>
            <strong>{{ formatTripTitle(trip) }}</strong>
            <span>{{ formatDate(trip.tripDate || trip.createdAt) }}</span>
          </div>
          <small>{{ trip.visitCount }}곳 방문</small>
        </RouterLink>
      </div>

      <div v-else class="message-panel">
        <strong>퀴즈를 만들 여행이 없어요</strong>
        <p>완료된 여행 기록이 생기면 이곳에서 바로 퀴즈를 시작할 수 있습니다.</p>
        <RouterLink to="/trip">여행 기록 보기</RouterLink>
      </div>
    </section>

    <section v-else-if="errorMessage" class="message-panel">
      <strong>잠시 멈췄어요</strong>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="tripId ? loadQuiz() : loadTrips()">다시 시도</button>
    </section>

    <template v-else-if="session && currentQuestion && !result">
      <section class="question-panel">
        <div class="question-meta">
          <span>문제 {{ currentIndex + 1 }} / {{ totalCount }}</span>
          <span>{{ getDifficultyLabel(currentQuestion.difficulty) }}</span>
        </div>

        <div class="heritage-context">
          <span>문화유산</span>
          <strong>{{ currentQuestion.heritageName }}</strong>
        </div>

        <h1>{{ currentQuestion.content }}</h1>

        <p v-if="currentQuestion.source" class="source-note">
          출처: {{ currentQuestion.source }}
        </p>
      </section>

      <section class="choice-list">
        <h2>답을 선택하세요</h2>
        <button
          v-for="choice in currentQuestion.choices"
          :key="choice.choiceId"
          class="choice-button"
          :class="{ selected: selectedChoiceIds[currentQuestion.sessionId] === choice.choiceId }"
          type="button"
          @click="selectChoice(currentQuestion, choice)"
        >
          <i></i>
          <span>{{ choice.content }}</span>
        </button>
      </section>

      <footer class="quiz-actions">
        <button type="button" :disabled="currentIndex === 0" @click="goPrevious">← Previous</button>
        <button
          v-if="currentIndex < questions.length - 1"
          class="primary"
          type="button"
          @click="goNext"
        >
          Next
        </button>
        <button
          v-else
          class="primary"
          type="button"
          :disabled="!hasAnsweredAll || isSubmitting"
          @click="submitQuiz"
        >
          {{ isSubmitting ? 'Submitting' : `Submit (${answeredCount}/${totalCount})` }}
        </button>
      </footer>
    </template>

    <template v-else-if="result">
      <section class="score-section">
        <div class="score-ring">
          <svg viewBox="0 0 192 192">
            <circle cx="96" cy="96" r="80"></circle>
            <circle
              class="value"
              cx="96"
              cy="96"
              r="80"
              :stroke-dasharray="`${2 * Math.PI * 80}`"
              :stroke-dashoffset="scoreStrokeOffset"
            ></circle>
          </svg>
          <div>
            <strong>{{ result.correctCount }}/{{ result.totalCount }} 정답</strong>
            <span>({{ result.accuracy }}%)</span>
          </div>
        </div>

        <h1>{{ result.accuracy >= 80 ? '훌륭합니다!' : '좋은 복습이에요' }}</h1>
        <p>당신의 통찰력이 과거의 기록을 또렷하게 밝혀내고 있습니다.</p>
      </section>

      <section class="review-list">
        <h2>Archival Review</h2>

        <article
          v-for="entry in resultEntries"
          :key="entry.question.sessionId"
          class="review-card"
          :class="{ open: openResultId === entry.question.sessionId }"
        >
          <button type="button" @click="toggleResult(entry.question.sessionId)">
            <span :class="entry.result?.correct ? 'ok' : 'bad'">
              {{ entry.result?.correct ? '✓' : '×' }}
            </span>
            <div>
              <small>Question {{ String(entry.index + 1).padStart(2, '0') }}</small>
              <strong>{{ entry.question.content }}</strong>
            </div>
            <i>⌄</i>
          </button>

          <div v-if="openResultId === entry.question.sessionId && entry.result" class="review-detail">
            <p>
              <b>정답:</b>
              {{ getChoiceContent(entry.question, entry.result.correctChoiceId) }}
            </p>
            <p v-if="!entry.result.correct">
              <b>내 선택:</b>
              {{ getChoiceContent(entry.question, entry.result.selectedChoiceId) }}
            </p>
            <p v-if="entry.result.explanation">{{ entry.result.explanation }}</p>
          </div>
        </article>
      </section>

      <div class="result-actions">
        <RouterLink to="/">Home</RouterLink>
      </div>
    </template>

    <section v-else-if="!isLoading" class="message-panel">
      <strong>문제가 없어요</strong>
      <p>완료된 여행 기록이 있어야 퀴즈를 만들 수 있습니다.</p>
      <RouterLink to="/trip">여행 기록 보기</RouterLink>
    </section>
  </main>

  <LoadingOverlay v-if="isLoading" message="퀴즈를 준비하고 있어요" />
</template>

<style scoped>
.quiz-page {
  min-height: 100dvh;
  padding: 0 18px 112px;
  color: #18212f;
  background: #f5f7fb;
}

.quiz-page.result {
  padding-bottom: 120px;
}

.quiz-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  height: 64px;
  margin: 0 -18px;
  padding: 0 18px;
  border-bottom: 1px solid #d9dee8;
  background: rgba(245, 247, 251, 0.96);
  backdrop-filter: blur(14px);
}

.quiz-header button,
.quiz-header a {
  color: #031632;
  background: transparent;
  font-size: 26px;
  text-decoration: none;
}

.quiz-header strong {
  color: #031632;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28px;
}

.session-meter {
  display: grid;
  justify-items: end;
}

.session-meter span {
  color: #5c5f60;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.session-meter i {
  display: block;
  width: 96px;
  height: 5px;
  margin-top: 5px;
  border-radius: 999px;
  overflow: hidden;
  background: #dce4f0;
}

.session-meter b {
  display: block;
  height: 100%;
  background: #031632;
}

.quiz-index,
.score-section {
  padding-top: 44px;
  text-align: center;
}

.index-title span,
.review-list h2 {
  color: #5c5f60;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.index-title h1,
.score-section h1 {
  color: #031632;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 32px;
  line-height: 1.22;
}

.index-title h1 {
  margin-top: 10px;
}

.index-title p,
.score-section p {
  margin-top: 10px;
  color: #44474d;
  font-size: 15px;
  line-height: 1.6;
}

.trip-list {
  display: grid;
  gap: 12px;
  margin-top: 28px;
}

.trip-card,
.message-panel,
.question-panel,
.choice-button,
.review-card {
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(26, 43, 72, 0.07);
}

.trip-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  min-height: 78px;
  padding: 16px;
  color: inherit;
  text-align: left;
  text-decoration: none;
}

.trip-card strong,
.trip-card span,
.trip-card small {
  display: block;
}

.trip-card strong {
  color: #031632;
  font-size: 15px;
}

.trip-card span,
.trip-card small {
  color: #5c5f60;
  font-size: 12px;
}

.message-panel {
  margin-top: 24px;
  padding: 20px;
  text-align: left;
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

.message-panel button,
.message-panel a,
.result-actions a,
.result-actions button {
  display: grid;
  min-height: 48px;
  border-radius: 4px;
  place-items: center;
  color: #ffffff;
  background: #031632;
  font-weight: 800;
  text-decoration: none;
}

.question-panel {
  margin-top: 22px;
  padding: 20px 18px 18px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-meta span {
  min-height: 30px;
  padding: 7px 12px;
  border: 1px solid #d7deea;
  border-radius: 999px;
  color: #344155;
  background: #f4f7fc;
  font-size: 12px;
  font-weight: 900;
}

.question-meta span:first-child {
  color: #ffffff;
  background: #031632;
  border-color: #031632;
}

.heritage-context {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #edf0f5;
}

.heritage-context span {
  color: #8a4b10;
  font-size: 12px;
  font-weight: 900;
}

.heritage-context strong {
  color: #344155;
  font-size: 14px;
  line-height: 1.35;
}

.question-panel h1 {
  margin-top: 14px;
  color: #031632;
  font-family: var(--font-serif);
  font-size: clamp(25px, 7.5vw, 31px);
  line-height: 1.32;
  letter-spacing: 0;
  word-break: keep-all;
}

.source-note {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #edf0f5;
  color: #697386;
  font-size: 12px;
  line-height: 1.45;
}

.choice-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.choice-list h2 {
  color: #4b5567;
  font-size: 13px;
  font-weight: 900;
}

.choice-button {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 72px;
  padding: 16px 18px;
  color: #121c28;
  text-align: left;
}

.choice-button i {
  width: 24px;
  height: 24px;
  border: 2px solid #75777e;
  border-radius: 999px;
}

.choice-button span {
  font-size: 16px;
  line-height: 1.45;
}

.choice-button.selected {
  border-color: #1d4f91;
  background: #eaf2ff;
}

.choice-button.selected i {
  border: 7px solid #1d4f91;
}

.quiz-actions {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: 0.9fr 1.2fr;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border-top: 1px solid #d9dee8;
  background: #ffffff;
}

@media (min-width: 768px) {
  .quiz-actions {
    width: min(100%, var(--mobile-max-width));
    margin: 0 auto;
  }
}

.quiz-actions button {
  min-height: 56px;
  border-radius: 4px;
  color: #5c5f60;
  background: #e5eeff;
  font-weight: 900;
  text-transform: uppercase;
}

.quiz-actions .primary {
  color: #ffffff;
  background: #031632;
  border-bottom: 3px solid #000814;
}

.quiz-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.score-section {
  padding-top: 48px;
}

.score-ring {
  position: relative;
  width: 192px;
  height: 192px;
  margin: 0 auto 28px;
}

.score-ring svg {
  width: 100%;
  height: 100%;
}

.score-ring circle {
  fill: transparent;
  stroke: #d9e3f4;
  stroke-width: 8;
}

.score-ring .value {
  stroke: #1a2b48;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 600ms ease;
}

.score-ring div {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
}

.score-ring strong {
  color: #031632;
  font-size: 30px;
}

.score-ring span {
  margin-top: 5px;
  color: #5c5f60;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.score-section h1 {
  font-size: 30px;
}

.review-list {
  margin-top: 48px;
}

.review-list h2 {
  padding-bottom: 10px;
  border-bottom: 1px solid #c5c6ce;
}

.review-card {
  margin-top: 14px;
  overflow: hidden;
}

.review-card > button {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 16px;
  color: inherit;
  text-align: left;
}

.review-card .ok,
.review-card .bad {
  display: grid;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  place-items: center;
  font-size: 22px;
  font-weight: 900;
}

.review-card .ok {
  color: #16833f;
  background: #e8f6ed;
}

.review-card .bad {
  color: #ba1a1a;
  background: #ffdad6;
}

.review-card small,
.review-card strong {
  display: block;
}

.review-card small {
  color: #5c5f60;
  font-size: 11px;
}

.review-card strong {
  margin-top: 3px;
  color: #121c28;
  font-size: 15px;
  line-height: 1.35;
}

.review-card i {
  color: #5c5f60;
  font-style: normal;
  transition: transform 180ms ease;
}

.review-card.open i {
  transform: rotate(180deg);
}

.review-detail {
  padding: 16px;
  border-top: 1px solid #c5c6ce;
  background: #eef4ff;
}

.review-detail p {
  color: #44474d;
  font-size: 13px;
  line-height: 1.55;
}

.review-detail p + p {
  margin-top: 8px;
}

.result-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 48px;
}

.result-actions button {
  color: #031632;
  background: #e5eeff;
}
</style>
