<script setup lang="ts">
import type { RecommendedHeritage } from '@/types/api'
import { normalizeAssetUrl } from '@/utils/assetUrl'

defineProps<{
  heritages: RecommendedHeritage[]
  isLoading: boolean
  error: 'geo' | 'empty' | null
}>()

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}
</script>

<template>
  <div class="nearby-section">
    <p class="nearby-label">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="6.5" r="2.5" />
        <path d="M8 1a5.5 5.5 0 0 1 5.5 5.5C13.5 10 8 15 8 15S2.5 10 2.5 6.5A5.5 5.5 0 0 1 8 1z" />
      </svg>
      근처에 이런 곳도 있어요
    </p>
    <div v-if="isLoading" class="nearby-list">
      <div v-for="i in 3" :key="i" class="skeleton sk-nearby"></div>
    </div>
    <ul v-else-if="heritages.length > 0" class="nearby-list">
      <li v-for="h in heritages" :key="h.heritageId">
        <RouterLink :to="`/heritage/${h.heritageId}`" class="nearby-item">
          <img v-if="h.thumbnailUrl" :src="normalizeAssetUrl(h.thumbnailUrl)" :alt="h.name" class="nearby-thumb" />
          <div v-else class="nearby-thumb-placeholder" aria-hidden="true"></div>
          <div class="nearby-info">
            <span class="nearby-name">{{ h.name }}</span>
            <span class="nearby-dist">{{ formatDistance(h.distanceM) }} 거리</span>
          </div>
          <svg class="nearby-arrow" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 5l4 3-4 3" />
          </svg>
        </RouterLink>
      </li>
    </ul>
    <p v-else-if="error === 'geo'" class="nearby-empty">
      위치 권한이 필요해요. 브라우저 설정을 확인해 주세요.
    </p>
    <p v-else class="nearby-empty">현재 위치 주변에 추천할 문화재가 없어요.</p>
  </div>
</template>

<style scoped>
.nearby-section {
  margin-top: 12px;
}

.nearby-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 600;
}
.nearby-label svg {
  width: 12px;
  fill: none;
  stroke: var(--color-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.nearby-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
  padding: 0;
}

.nearby-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 12px;
  background: var(--color-surface-lowest);
  text-decoration: none;
  color: var(--color-text-base);
  transition: background var(--transition);
}
.nearby-item:hover {
  background: var(--color-surface-low);
}

.nearby-thumb {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.nearby-thumb-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: var(--color-surface-highest);
  flex-shrink: 0;
}

.nearby-info {
  flex: 1;
  min-width: 0;
}
.nearby-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nearby-dist {
  font-size: 11px;
  color: var(--color-text-muted);
}

.nearby-arrow {
  width: 14px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--color-outline-variant);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.nearby-empty {
  color: var(--color-text-muted);
  font-size: 12px;
  padding: 8px 0;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 14px;
}
.sk-nearby {
  height: 62px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
