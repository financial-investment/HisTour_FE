<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { quizApi, type QuizAnswerSubmitRequest } from '@/api/quizApi'
import { tripApi } from '@/api/tripApi'
import type {
  QuizChoiceResponse,
  QuizQuestionResponse,
  QuizResultResponse,
  QuizSessionResponse,
  TripResponse,
} from '@/types/api'
import QuizHeader from './components/QuizHeader.vue'
import QuizIndex from './components/QuizIndex.vue'
import QuizQuestion from './components/QuizQuestion.vue'
import QuizResult from './components/QuizResult.vue'

const route = useRoute()

const session = ref<QuizSessionResponse | null>(null)
const result = ref<QuizResultResponse | null>(null)
const selectedChoiceIds = ref<Record<number, number>>({})
const currentIndex = ref(0)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const trips = ref<TripResponse[]>([])

const tripId = computed(() => {
  const raw = route.params.tripId
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? Number(value) : null
})
const isQuizIndex = computed(() => tripId.value === null)
const completedTrips = computed(() => trips.value.filter((t) => t.status === 'COMPLETED'))
const questions = computed(() => session.value?.questions ?? [])
const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
const totalCount = computed(() => session.value?.totalCount ?? questions.value.length)
const answeredCount = computed(() => Object.keys(selectedChoiceIds.value).length)
const hasAnsweredAll = computed(
  () => questions.value.length > 0 && questions.value.every((q) => selectedChoiceIds.value[q.sessionId]),
)
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round(((currentIndex.value + 1) / totalCount.value) * 100)
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

function handleSelectChoice(question: QuizQuestionResponse, choice: QuizChoiceResponse) {
  if (result.value || isSubmitting.value) return
  selectedChoiceIds.value = { ...selectedChoiceIds.value, [question.sessionId]: choice.choiceId }
}

async function submitQuiz() {
  if (!hasAnsweredAll.value || isSubmitting.value) return

  const answers: QuizAnswerSubmitRequest[] = questions.value.map((q) => ({
    sessionId: q.sessionId,
    choiceId: selectedChoiceIds.value[q.sessionId] as number,
  }))

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    result.value = await quizApi.submitResults(answers)
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
  let submitted: QuizResultResponse | null = null
  try {
    submitted = await quizApi.getResults(tripId.value)
  } catch {
    return
  }
  if (!submitted) return
  result.value = submitted
  selectedChoiceIds.value = submitted.results.reduce<Record<number, number>>((acc, item) => {
    acc[item.sessionId] = item.selectedChoiceId
    return acc
  }, {})
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response
    return res?.data?.message || fallback
  }
  return fallback
}

function getResponseStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = error as { response?: { status?: number } }
    return res.response?.status
  }
  return undefined
}
</script>

<template>
  <main class="quiz-page" :class="{ result: Boolean(result) }">
    <QuizHeader :has-result="Boolean(result)" :progress-percent="progressPercent" />

    <QuizIndex v-if="isQuizIndex && !errorMessage" :trips="completedTrips" />

    <section v-else-if="errorMessage" class="message-panel">
      <strong>잠시 멈췄어요</strong>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="tripId ? loadQuiz() : loadTrips()">다시 시도</button>
    </section>

    <QuizQuestion
      v-else-if="session && currentQuestion && !result"
      :question="currentQuestion"
      :current-index="currentIndex"
      :total-count="totalCount"
      :selected-choice-id="selectedChoiceIds[currentQuestion.sessionId]"
      :is-submitting="isSubmitting"
      :has-answered-all="hasAnsweredAll"
      :answered-count="answeredCount"
      :is-last-question="currentIndex === questions.length - 1"
      @select="(choice) => handleSelectChoice(currentQuestion!, choice)"
      @previous="currentIndex = Math.max(currentIndex - 1, 0)"
      @next="currentIndex = Math.min(currentIndex + 1, questions.length - 1)"
      @submit="submitQuiz"
    />

    <QuizResult
      v-else-if="result && tripId"
      :result="result"
      :questions="questions"
      :trip-id="tripId"
    />

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

.message-panel {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(26, 43, 72, 0.07);
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
.message-panel a {
  display: grid;
  min-height: 48px;
  border-radius: 4px;
  place-items: center;
  color: #fff;
  background: #031632;
  font-weight: 800;
  text-decoration: none;
}
</style>
