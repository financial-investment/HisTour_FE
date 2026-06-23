<script setup lang="ts">
import type { VisitLogResponse } from '@/types/api'

defineProps<{
  logs: VisitLogResponse[]
  errorMessage: string
}>()

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
</script>

<template>
  <section class="visited-section">
    <div class="section-heading">
      <div>
        <span>JOURNEY LOG</span>
        <h2>방문한 문화재</h2>
      </div>
      <strong>{{ logs.length }}</strong>
    </div>
    <div v-if="logs.length" class="visit-list">
      <article v-for="log in logs" :key="log.id" class="visit-card">
        <img v-if="log.photoUrl" :src="log.photoUrl" :alt="log.heritageName" />
        <div v-else class="photo-placeholder" aria-hidden="true">🏛</div>
        <div>
          <strong>{{ log.heritageName }}</strong>
          <span>Visited {{ formatTime(log.visitedAt) }}</span>
        </div>
      </article>
    </div>
    <div v-else class="empty-log">
      <span>⌖</span>
      <p>아직 기록된 문화재가 없어요.<br />스캔 버튼으로 첫 장소를 남겨보세요.</p>
    </div>
    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.visited-section {
  padding: 22px 18px 30px;
  background: #f8f9ff;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
}
.section-heading span {
  color: #c46c18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.section-heading h2 {
  margin-top: 2px;
  font-family: var(--font-serif);
  font-size: 19px;
}
.section-heading > strong {
  color: #8b96a4;
  font-size: 22px;
}

.visit-list {
  margin: 15px -18px 0;
  padding: 0 18px 8px;
  display: flex;
  gap: 11px;
  overflow-x: auto;
  scrollbar-width: none;
}
.visit-card {
  width: 150px;
  flex: 0 0 auto;
  border: 1px solid #dce2eb;
  background: white;
  box-shadow: 0 4px 12px rgba(26, 43, 72, 0.06);
}
.visit-card img,
.photo-placeholder {
  width: 100%;
  height: 94px;
  object-fit: cover;
}
.photo-placeholder {
  display: grid;
  place-items: center;
  color: #9b6a36;
  background: linear-gradient(145deg, #eee2ca, #d9cab0);
  font-size: 30px;
}
.visit-card > div {
  padding: 10px;
  display: flex;
  flex-direction: column;
}
.visit-card strong {
  font-family: var(--font-serif);
  font-size: 12px;
}
.visit-card span {
  margin-top: 3px;
  color: #848d98;
  font-size: 8px;
}

.empty-log {
  margin-top: 15px;
  padding: 25px;
  border: 1px dashed #cbd3df;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  color: #75808e;
  background: white;
  font-size: 11px;
  line-height: 1.5;
}
.empty-log > span {
  font-size: 25px;
}

.error-message {
  margin-top: 14px;
  color: #ba1a1a;
  font-size: 12px;
  text-align: center;
}
</style>
