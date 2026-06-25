<script setup lang="ts">
import type { TripResponse } from '@/types/api'
import { formatTripDate } from '@/utils/formatDate'

defineProps<{
  trips: TripResponse[]
}>()

function formatTripTitle(trip: TripResponse) {
  return trip.title || `${formatTripDate(trip.tripDate || trip.createdAt)} 여행`
}
</script>

<template>
  <section class="quiz-index">
    <div class="index-title">
      <span>ARCHIVAL QUIZ</span>
      <h1>완료한 여행을 선택하세요</h1>
      <p>다녀온 장소를 기반으로 기억을 점검합니다.</p>
    </div>

    <div v-if="trips.length" class="trip-list">
      <RouterLink
        v-for="trip in trips"
        :key="trip.tripId"
        class="trip-card"
        :to="`/quiz/${trip.tripId}`"
      >
        <div>
          <strong>{{ formatTripTitle(trip) }}</strong>
          <span>{{ formatTripDate(trip.tripDate || trip.createdAt) }}</span>
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
</template>

<style scoped>
.quiz-index {
  padding-top: 44px;
  text-align: center;
}

.index-title span {
  color: #5c5f60;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.index-title h1 {
  margin-top: 10px;
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  line-height: 1.22;
}

.index-title p {
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

.trip-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  min-height: 78px;
  padding: 16px;
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  color: inherit;
  text-align: left;
  text-decoration: none;
  background: #fff;
  box-shadow: 0 8px 20px rgba(26, 43, 72, 0.07);
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
  border: 1px solid #d5dbe6;
  border-radius: 4px;
  background: #fff;
  text-align: left;
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
