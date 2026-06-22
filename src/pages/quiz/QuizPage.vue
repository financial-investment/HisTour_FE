<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { quizApi, type QuizAnswerSubmitRequest } from '@/api/quizApi'
import type {
  QuizChoiceResponse,
  QuizQuestionResponse,
  QuizResultItemResponse,
  QuizResultResponse,
  QuizSessionResponse,
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

const tripId = computed(() => Number(route.params.tripId))
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

onMounted(loadQuiz)

async function loadQuiz() {
  if (!Number.isFinite(tripId.value) || tripId.value <= 0) {
    errorMessage.value = '퀴즈를 불러올 여행 정보가 올바르지 않습니다.'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    try {
      session.value = await quizApi.getSession(tripId.value)
    } catch {
      session.value = await quizApi.createSession(tripId.value)
    }
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
    [question.sessionId]: choice.id,
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
    currentIndex.value = 0
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '답안을 제출하지 못했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

function restartReview() {
  currentIndex.value = 0
  result.value = null
  selectedChoiceIds.value = {}
}

function getChoiceContent(question: QuizQuestionResponse, choiceId: number) {
  return question.choices.find((choice) => choice.id === choiceId)?.content ?? ''
}

function getResultFor(question: QuizQuestionResponse): QuizResultItemResponse | undefined {
  return resultBySessionId.value.get(question.sessionId)
}

function getDifficultyLabel(difficulty: string) {
  const labels: Record<string, string> = {
    EASY: '쉬움',
    MEDIUM: '보통',
    HARD: '어려움',
  }
  return labels[difficulty] ?? difficulty
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
</script>

<template>
  <main class="quiz-page">
    <header class="quiz-header">
      <button class="icon-button" type="button" aria-label="뒤로 가기" @click="router.back()">‹</button>
      <div>
        <p>여행 복습</p>
        <h1>히스토리 퀴즈</h1>
      </div>
      <RouterLink class="icon-button" :to="`/report/${tripId}`" aria-label="리포트 보기">↗</RouterLink>
    </header>

    <section v-if="errorMessage" class="message-panel">
      <strong>잠시 멈췄어요</strong>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadQuiz">다시 시도</button>
    </section>

    <template v-else-if="session && currentQuestion">
      <section v-if="result" class="result-hero">
        <p>채점 완료</p>
        <h2>{{ result.correctCount }} / {{ result.totalCount }}</h2>
        <span>정답률 {{ result.accuracy }}%</span>
      </section>

      <section v-else class="progress-panel" aria-label="퀴즈 진행률">
        <div>
          <strong>{{ currentIndex + 1 }}</strong>
          <span>/ {{ totalCount }}</span>
        </div>
        <div class="progress-track">
          <i :style="{ width: `${progressPercent}%` }" />
        </div>
        <small>{{ answeredCount }}문제 답변 완료</small>
      </section>

      <article class="question-card">
        <div class="question-meta">
          <span>{{ currentQuestion.heritageName }}</span>
          <span>{{ getDifficultyLabel(currentQuestion.difficulty) }}</span>
        </div>
        <h2>{{ currentQuestion.title }}</h2>
        <p>{{ currentQuestion.content }}</p>

        <div class="choice-list">
          <button
            v-for="(choice, index) in currentQuestion.choices"
            :key="choice.id"
            class="choice-button"
            :class="{
              selected: selectedChoiceIds[currentQuestion.sessionId] === choice.id,
              correct: getResultFor(currentQuestion)?.correctChoiceId === choice.id,
              wrong:
                getResultFor(currentQuestion)?.selectedChoiceId === choice.id &&
                getResultFor(currentQuestion)?.correct === false,
            }"
            type="button"
            @click="selectChoice(currentQuestion, choice)"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ choice.content }}</strong>
          </button>
        </div>

        <div v-if="result && getResultFor(currentQuestion)" class="explanation-panel">
          <strong>
            {{ getResultFor(currentQuestion)?.correct ? '정답입니다' : '다음에는 맞힐 수 있어요' }}
          </strong>
          <p>
            정답:
            {{ getChoiceContent(currentQuestion, getResultFor(currentQuestion)?.correctChoiceId ?? 0) }}
          </p>
          <small v-if="getResultFor(currentQuestion)?.explanation">
            {{ getResultFor(currentQuestion)?.explanation }}
          </small>
        </div>
      </article>

      <nav class="quiz-actions" aria-label="퀴즈 이동">
        <button type="button" :disabled="currentIndex === 0" @click="goPrevious">이전</button>
        <button
          v-if="currentIndex < questions.length - 1"
          class="primary"
          type="button"
          @click="goNext"
        >
          다음
        </button>
        <button
          v-else-if="!result"
          class="primary"
          type="button"
          :disabled="!hasAnsweredAll || isSubmitting"
          @click="submitQuiz"
        >
          {{ isSubmitting ? '제출 중' : '제출' }}
        </button>
        <button v-else class="primary" type="button" @click="restartReview">다시 풀기</button>
      </nav>
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
  padding: 18px 18px 96px;
  color: #17263a;
  background: #f7f8fc;
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 56px;
}

.quiz-header div {
  flex: 1;
}

.quiz-header p,
.result-hero p {
  color: #d97706;
  font-size: 12px;
  font-weight: 700;
}

.quiz-header h1 {
  margin-top: 2px;
  color: #172f50;
  font-size: 24px;
  line-height: 1.25;
}

.icon-button {
  display: grid;
  width: 42px;
  height: 42px;
  border: 1px solid #dde3ed;
  border-radius: 8px;
  place-items: center;
  color: #172f50;
  background: #ffffff;
  font-size: 24px;
  text-decoration: none;
}

.progress-panel,
.question-card,
.message-panel,
.result-hero {
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(23, 47, 80, 0.08);
}

.progress-panel {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 14px;
}

.progress-panel strong {
  color: #d97706;
  font-size: 20px;
}

.progress-panel span,
.progress-panel small {
  color: #7a8290;
  font-size: 12px;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #e9edf4;
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #172f50;
  transition: width 180ms ease;
}

.result-hero {
  margin-top: 18px;
  padding: 24px;
  text-align: center;
}

.result-hero h2 {
  margin-top: 8px;
  color: #172f50;
  font-size: 42px;
  line-height: 1;
}

.result-hero span {
  display: inline-flex;
  margin-top: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  color: #ffffff;
  background: #172f50;
  font-size: 12px;
  font-weight: 700;
}

.question-card {
  margin-top: 14px;
  padding: 22px 18px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.question-meta span {
  padding: 5px 9px;
  border-radius: 999px;
  color: #44566f;
  background: #eef3fa;
  font-size: 11px;
  font-weight: 700;
}

.question-card h2 {
  color: #172f50;
  font-size: 20px;
  line-height: 1.35;
}

.question-card p {
  margin-top: 10px;
  color: #465367;
  font-size: 15px;
  line-height: 1.55;
}

.choice-list {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.choice-button {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid #dde3ed;
  border-radius: 8px;
  color: #25364c;
  background: #ffffff;
  text-align: left;
}

.choice-button span {
  display: grid;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  place-items: center;
  color: #687385;
  background: #eef3fa;
  font-weight: 800;
}

.choice-button strong {
  min-width: 0;
  font-size: 14px;
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.choice-button.selected {
  border-color: #172f50;
  background: #f0f5fb;
}

.choice-button.selected span {
  color: #ffffff;
  background: #172f50;
}

.choice-button.correct {
  border-color: #2f7d4e;
  background: #edf8f1;
}

.choice-button.correct span {
  color: #ffffff;
  background: #2f7d4e;
}

.choice-button.wrong {
  border-color: #ba1a1a;
  background: #fff1ef;
}

.choice-button.wrong span {
  color: #ffffff;
  background: #ba1a1a;
}

.explanation-panel {
  margin-top: 18px;
  padding: 14px;
  border-radius: 8px;
  background: #fff7ed;
}

.explanation-panel strong {
  color: #9a4f03;
  font-size: 14px;
}

.explanation-panel p,
.explanation-panel small {
  display: block;
  margin-top: 8px;
  color: #68411e;
  font-size: 13px;
  line-height: 1.5;
}

.quiz-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
  margin-top: 14px;
}

.quiz-actions button,
.message-panel button,
.message-panel a {
  min-height: 48px;
  border-radius: 8px;
  color: #172f50;
  background: #e8eef7;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
  text-decoration: none;
}

.quiz-actions .primary,
.message-panel button,
.message-panel a {
  display: grid;
  place-items: center;
  color: #ffffff;
  background: #172f50;
}

.quiz-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.message-panel {
  margin-top: 18px;
  padding: 22px;
}

.message-panel strong {
  color: #172f50;
  font-size: 18px;
}

.message-panel p {
  margin: 9px 0 16px;
  color: #687385;
  font-size: 14px;
  line-height: 1.5;
}
</style>
