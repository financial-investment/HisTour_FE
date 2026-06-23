<script setup lang="ts">
import type { TripResponse, RecommendedHeritage } from '@/types/api'
import MainNearbyList from './MainNearbyList.vue'

defineProps<{
  trip: TripResponse
  nearbyHeritages: RecommendedHeritage[]
  isLoadingNearby: boolean
  nearbyError: 'geo' | 'empty' | null
}>()

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10).replace(/-/g, '.')
}
</script>

<template>
  <div>
    <RouterLink to="/trip" class="active-card">
      <div class="active-card-top">
        <span class="active-badge">
          <span class="pulse"></span>
          진행 중
        </span>
        <span class="active-date">{{ formatDate(trip.tripDate ?? trip.createdAt) }}</span>
      </div>
      <h2 class="active-title">{{ trip.title ?? '진행 중인 여행' }}</h2>
      <div class="active-footer">
        <div class="active-visits">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 12.5c0-2.5 2.2-4 5-4s5 1.5 5 4" />
          </svg>
          {{ trip.visitCount }}곳 방문
        </div>
        <span class="active-cta">
          계속 탐험하기
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 5l4 3-4 3" />
          </svg>
        </span>
      </div>
    </RouterLink>

    <MainNearbyList
      :heritages="nearbyHeritages"
      :is-loading="isLoadingNearby"
      :error="nearbyError"
    />
  </div>
</template>

<style scoped>
.active-card {
  display: block;
  padding: 20px 22px;
  border-radius: 18px;
  background: linear-gradient(
    150deg,
    var(--color-primary-container) 0%,
    var(--color-primary-gradient) 100%
  );
  box-shadow: var(--shadow-lg);
  color: var(--color-on-primary);
  text-decoration: none;
  transition: filter var(--transition);
}
.active-card:hover {
  filter: brightness(1.06);
}

.active-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(219, 121, 10, 0.85);
  font-size: 11px;
  font-weight: 700;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.6s ease infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.75);
  }
}

.active-date {
  font-size: 12px;
  color: var(--color-on-primary-meta);
}

.active-title {
  margin-top: 14px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.3;
}

.active-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.active-visits {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-on-primary-meta);
  font-size: 12px;
}
.active-visits svg {
  width: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.active-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 12px;
  font-weight: 600;
}
.active-cta svg {
  width: 13px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}
</style>
