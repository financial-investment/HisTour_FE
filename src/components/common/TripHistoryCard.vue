<script setup lang="ts">
import { computed } from 'vue'
import { applyFallbackAsset, normalizeAssetUrl } from '@/utils/assetUrl'
import type { TripResponse } from '@/types/api'

const props = defineProps<{
  trip: TripResponse
  thumb?: string | null
  fallbackThumb?: string | null
  label?: string
}>()

const daysSince = computed(() => {
  const raw = props.trip.tripDate ?? props.trip.createdAt.slice(0, 10)
  return Math.floor((Date.now() - new Date(raw).getTime()) / (1000 * 60 * 60 * 24))
})

function formatDate(tripDate: string | null, createdAt: string) {
  return (tripDate ?? createdAt).slice(0, 10).replace(/-/g, '.')
}
</script>

<template>
  <RouterLink :to="`/report/${trip.tripId}`" class="trip-history-card">
    <div class="thumb-wrap">
      <img
        v-if="thumb"
        :src="normalizeAssetUrl(thumb)"
        :alt="trip.title ?? ''"
        class="thumb"
        @error="applyFallbackAsset($event, fallbackThumb)"
      />
      <div v-else class="thumb-placeholder" aria-hidden="true">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 30h28M9 26h22M13 24V12h14v12M11 12h18L20 3 11 12Z" />
          <path d="M16 15v7M20 15v7M24 15v7" />
        </svg>
      </div>
      <span class="days-badge">{{ daysSince }}일 전</span>
    </div>

    <div class="info">
      <span v-if="label" class="info-label">{{ label }}</span>
      <h2 class="info-title">{{ trip.title ?? '이름 없는 여행' }}</h2>
      <div class="info-meta">
        <span>
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
            <path d="M4 1.5v2M10 1.5v2M1.5 6h11" />
          </svg>
          {{ formatDate(trip.tripDate, trip.createdAt) }}
        </span>
        <span>
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="7" cy="5.5" r="2.2" />
            <path
              d="M7 1a4.5 4.5 0 0 1 4.5 4.5C11.5 9 7 13 7 13S2.5 9 2.5 5.5A4.5 4.5 0 0 1 7 1z"
            />
          </svg>
          {{ trip.visitCount }}곳 방문
        </span>
      </div>
      <span class="info-cta">
        여행 리포트 보기
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2 7h10M8 4l4 3-4 3" />
        </svg>
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.trip-history-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 18px;
  background: var(--color-surface-lowest);
  text-decoration: none;
  color: var(--color-text-base);
  transition: background var(--transition);
}
.trip-history-card:hover {
  background: var(--color-surface-low);
}

.thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 96px;
}

.thumb {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
}

.thumb-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  place-items: center;
  background: linear-gradient(
    140deg,
    var(--color-surface-high) 0%,
    var(--color-surface-highest) 100%
  );
}
.thumb-placeholder svg {
  width: 36px;
  color: var(--color-outline-variant);
}

.days-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 10px;
  font-weight: 700;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.info-title {
  margin-top: 5px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary-container);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-meta {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 11px;
}
.info-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.info-meta svg {
  width: 11px;
  flex-shrink: 0;
}

.info-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 700;
}
.info-cta svg {
  width: 12px;
}
</style>
