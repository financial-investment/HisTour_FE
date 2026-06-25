<script setup lang="ts">
import { computed } from 'vue'
import type { QuizResultResponse } from '@/types/api'

const props = defineProps<{
  tripId: number
  quizResult: QuizResultResponse | null
}>()

const resultMessage = computed(() => {
  const accuracy = props.quizResult?.accuracy ?? 0
  if (accuracy >= 80) return '이번 여행을 또렷하게 기억하고 있어요'
  if (accuracy >= 50) return '좋은 복습 흐름이에요'
  return '다시 읽어보면 더 오래 남을 기록이에요'
})
</script>

<template>
  <section class="quiz-cta" :class="{ completed: quizResult }">
    <h2>여행 퀴즈</h2>
    <template v-if="quizResult">
      <div class="quiz-result-card">
        <span>{{ resultMessage }}</span>
        <strong>{{ quizResult.correctCount }}/{{ quizResult.totalCount }}</strong>
        <small>정답률 {{ quizResult.accuracy }}%</small>
      </div>
      <RouterLink class="result-link" :to="`/quiz/${tripId}`">퀴즈 결과 보기</RouterLink>
    </template>
    <p>여행 후 퀴즈로 방금 정리한 기록을 오래 남겨보세요.</p>
    <RouterLink :to="`/quiz/${tripId}`">퀴즈 풀기</RouterLink>
  </section>
</template>

<style scoped>
.quiz-cta {
  text-align: center;
}

.quiz-cta h2 {
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
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
  font-family: Georgia, 'Times New Roman', serif;
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
