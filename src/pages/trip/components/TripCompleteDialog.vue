<script setup lang="ts">
import type { TripDetailResponse } from '@/types/api'

defineProps<{
  activeTrip: TripDetailResponse
  visitedCount: number
  isCompleting: boolean
}>()

defineEmits<{
  close: []
  complete: []
}>()

function formatDate(value?: string | null) {
  if (!value) return '오늘'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${value}T00:00:00`))
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="$emit('close')">
    <section
      class="complete-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-title"
    >
      <div class="dialog-emblem">✓</div>
      <p>JOURNEY COMPLETE</p>
      <h2 id="complete-title">여행을 마칠까요?</h2>
      <span>완료하면 지금까지의 기록으로 여행 리포트와 역사 퀴즈를 만들 수 있어요.</span>
      <dl>
        <div>
          <dt>방문 문화재</dt>
          <dd>{{ visitedCount }}곳</dd>
        </div>
        <div>
          <dt>여행 날짜</dt>
          <dd>{{ formatDate(activeTrip.tripDate) }}</dd>
        </div>
      </dl>
      <button
        class="primary-button"
        type="button"
        :disabled="isCompleting"
        @click="$emit('complete')"
      >
        {{ isCompleting ? '기록 정리 중...' : '여행 완료하기' }}
      </button>
      <button class="text-button" type="button" @click="$emit('close')">여행 계속하기</button>
    </section>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  z-index: 10000;
  inset: 0;
  padding: 20px;
  display: grid;
  place-items: center;
  background: rgba(3, 22, 50, 0.68);
  backdrop-filter: blur(5px);
}

.complete-dialog {
  width: min(100%, 360px);
  padding: 30px 25px 22px;
  text-align: center;
  color: #14233a;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}
.dialog-emblem {
  width: 54px;
  height: 54px;
  margin: auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
  background: #1c7750;
  font-size: 24px;
}
.complete-dialog > p {
  margin-top: 16px;
  color: #c46c18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
}
.complete-dialog h2 {
  margin-top: 5px;
  font-family: var(--font-serif);
  font-size: 24px;
}
.complete-dialog > span {
  display: block;
  margin-top: 9px;
  color: #6f7987;
  font-size: 12px;
  line-height: 1.6;
}
.complete-dialog dl {
  margin-top: 22px;
  border-block: 1px solid #e0e5ec;
}
.complete-dialog dl div {
  padding: 12px 2px;
  display: flex;
  justify-content: space-between;
}
.complete-dialog dl div + div {
  border-top: 1px solid #edf0f4;
}
.complete-dialog dt {
  color: #7a8491;
  font-size: 11px;
}
.complete-dialog dd {
  font-size: 12px;
  font-weight: 700;
}

.primary-button {
  width: 100%;
  min-height: 54px;
  margin-top: 22px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  background: #142b4c;
  font-weight: 700;
}
.primary-button:disabled {
  opacity: 0.55;
}
.text-button {
  margin-top: 14px;
  color: #687485;
  font-size: 11px;
}
</style>
