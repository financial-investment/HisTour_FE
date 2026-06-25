<script setup lang="ts">
import type { TripDetailResponse } from '@/types/api'
import { formatTripDate } from '@/utils/formatDate'

defineProps<{
  activeTrip: TripDetailResponse
  visitedCount: number
}>()

defineEmits<{
  complete: []
}>()

</script>

<template>
  <header class="active-header">
    <div>
      <p>ACTIVE JOURNEY</p>
      <h1>{{ activeTrip.title || '나의 역사 여행' }}</h1>
      <span>{{ formatTripDate(activeTrip.tripDate, '오늘') }} · 방문 {{ visitedCount }}곳</span>
    </div>
    <button
      type="button"
      aria-label="End trip"
      @click="$emit('complete')"
    >
      End Trip
    </button>
  </header>
</template>

<style scoped>
.active-header {
  min-height: 92px;
  padding: 17px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-bottom: 1px solid #d7dfeb;
}
.active-header p {
  color: #c46c18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.active-header h1 {
  margin-top: 3px;
  font-family: var(--font-serif);
  font-size: 21px;
}
.active-header div > span {
  color: #7c8795;
  font-size: 10px;
}
.active-header button {
  padding: 9px 13px;
  border-radius: 18px;
  color: white;
  background: #142b4c;
  font-size: 10px;
  font-weight: 700;
}
</style>
