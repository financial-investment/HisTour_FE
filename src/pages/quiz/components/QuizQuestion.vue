<script setup lang="ts">
import type { QuizChoiceResponse, QuizQuestionResponse } from '@/types/api'

const props = defineProps<{
  question: QuizQuestionResponse
  currentIndex: number
  totalCount: number
  selectedChoiceId: number | undefined
  isSubmitting: boolean
  hasAnsweredAll: boolean
  answeredCount: number
  isLastQuestion: boolean
}>()

const emit = defineEmits<{
  select: [choice: QuizChoiceResponse]
  previous: []
  next: []
  submit: []
}>()

function getDifficultyLabel(difficulty: string) {
  const labels: Record<string, string> = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' }
  return labels[difficulty] ?? difficulty
}
</script>

<template>
  <section class="question-panel">
    <div class="question-meta">
      <span>문제 {{ currentIndex + 1 }} / {{ totalCount }}</span>
      <span>{{ getDifficultyLabel(question.difficulty) }}</span>
    </div>

    <div class="heritage-context">
      <span>문화유산</span>
      <strong>{{ question.heritageName }}</strong>
    </div>

    <h1>{{ question.content }}</h1>

    <p v-if="question.source" class="source-note">출처: {{ question.source }}</p>
  </section>

  <section class="choice-list">
    <h2>답을 선택하세요</h2>
    <button
      v-for="choice in question.choices"
      :key="choice.choiceId"
      class="choice-button"
      :class="{ selected: selectedChoiceId === choice.choiceId }"
      type="button"
      @click="emit('select', choice)"
    >
      <i></i>
      <span>{{ choice.content }}</span>
    </button>
  </section>

  <footer class="quiz-actions">
    <button type="button" :disabled="currentIndex === 0" @click="emit('previous')">← Previous</button>
    <button v-if="!isLastQuestion" class="primary" type="button" @click="emit('next')">Next</button>
    <button
      v-else
      class="primary"
      type="button"
      :disabled="!hasAnsweredAll || isSubmitting"
      @click="emit('submit')"
    >
      {{ isSubmitting ? 'Submitting' : `Submit (${answeredCount}/${totalCount})` }}
    </button>
  </footer>
</template>

<style scoped>
.question-panel {
  margin-top: 22px;
  padding: 20px 18px 18px;
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(26, 43, 72, 0.07);
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
  color: #fff;
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
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  color: #121c28;
  text-align: left;
  background: #fff;
  box-shadow: 0 8px 20px rgba(26, 43, 72, 0.07);
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
  background: #fff;
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
  color: #fff;
  background: #031632;
  border-bottom: 3px solid #000814;
}

.quiz-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
