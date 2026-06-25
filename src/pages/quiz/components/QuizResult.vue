<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuizQuestionResponse, QuizResultResponse } from '@/types/api'

const props = defineProps<{
  result: QuizResultResponse
  questions: QuizQuestionResponse[]
  tripId: number
}>()

const openResultId = ref<number | null>(props.result.results[0]?.sessionId ?? null)

const scoreStrokeOffset = computed(() => {
  const circumference = 2 * Math.PI * 80
  return circumference - (props.result.accuracy / 100) * circumference
})

const resultBySessionId = computed(
  () => new Map(props.result.results.map((item) => [item.sessionId, item])),
)

const resultEntries = computed(() =>
  props.questions.map((question, index) => ({
    question,
    index,
    result: resultBySessionId.value.get(question.sessionId),
  })),
)

function toggleResult(sessionId: number) {
  openResultId.value = openResultId.value === sessionId ? null : sessionId
}

function getChoiceContent(question: QuizQuestionResponse, choiceId: number) {
  return question.choices.find((c) => c.choiceId === choiceId)?.content ?? ''
}
</script>

<template>
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

<style scoped>
.score-section {
  padding-top: 48px;
  text-align: center;
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
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 30px;
  line-height: 1.22;
}

.score-section p {
  margin-top: 10px;
  color: #44474d;
  font-size: 15px;
  line-height: 1.6;
}

.review-list {
  margin-top: 48px;
}

.review-list h2 {
  padding-bottom: 10px;
  border-bottom: 1px solid #c5c6ce;
  color: #5c5f60;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.review-card {
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(26, 43, 72, 0.07);
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

.result-actions a {
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
