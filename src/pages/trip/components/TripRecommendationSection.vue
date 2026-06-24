<script setup lang="ts">
import type { RecommendedHeritage } from '@/types/api'

defineProps<{
  tripId: number
  recommendations: RecommendedHeritage[]
  selectedHeritage: RecommendedHeritage | null
  isLoading: boolean
}>()

defineEmits<{
  select: [heritage: RecommendedHeritage]
}>()

function formatDistance(distanceM: number) {
  if (distanceM < 1000) return `${Math.round(distanceM)}m`
  return `${(distanceM / 1000).toFixed(1)}km`
}
</script>

<template>
  <section class="recommendation-section" aria-label="추천 문화유산">
    <RouterLink class="scan-entry" :to="`/trip/${tripId}/scan`">
      <span class="scan-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M8 12h8" />
        </svg>
      </span>
      <span>
        <strong>문화재 스캔하기</strong>
        <small>지금 보고 있는 문화재를 카메라로 기록해요.</small>
      </span>
      <svg class="scan-arrow" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8h10M9 5l4 3-4 3" />
      </svg>
    </RouterLink>

    <div class="section-heading">
      <div>
        <span>NEARBY HERITAGE</span>
        <h2>근처 추천 유적지</h2>
      </div>
      <strong v-if="!isLoading">{{ recommendations.length }}</strong>
    </div>

    <div v-if="isLoading" class="recommendation-list">
      <div v-for="i in 3" :key="i" class="recommendation-skeleton"></div>
    </div>

    <ul v-else-if="recommendations.length" class="recommendation-list">
      <li v-for="heritage in recommendations" :key="heritage.heritageId">
        <article
          class="recommendation-card"
          :class="{ selected: selectedHeritage?.heritageId === heritage.heritageId }"
        >
          <button type="button" class="select-button" @click="$emit('select', heritage)">
            <img v-if="heritage.thumbnailUrl" :src="heritage.thumbnailUrl" :alt="heritage.name" />
            <span v-else class="thumb-placeholder" aria-hidden="true">🏛</span>
            <span class="card-body">
              <span class="distance">{{ formatDistance(heritage.distanceM) }}</span>
              <strong>{{ heritage.name }}</strong>
            </span>
          </button>
          <RouterLink
            class="detail-link"
            :to="`/heritage/${heritage.heritageId}`"
            aria-label="문화유산 상세 보기"
          >
            상세
          </RouterLink>
        </article>
      </li>
    </ul>

    <div v-else class="empty-state">
      <p>현재 위치 주변에 추천할 문화유산이 없어요.</p>
    </div>
  </section>
</template>

<style scoped>
.recommendation-section {
  padding: 16px 18px 4px;
  background: #f8f9ff;
}

.scan-entry {
  min-height: 76px;
  padding: 14px 16px;
  border: 1px solid #d7dfeb;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 13px;
  color: #14233a;
  background: #fff;
  box-shadow: 0 6px 18px rgba(26, 43, 72, 0.08);
  text-decoration: none;
}

.scan-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #fff;
  background: #142b4c;
}
.scan-icon svg {
  width: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.scan-entry span:nth-child(2) {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.scan-entry strong {
  font-size: 14px;
}
.scan-entry small {
  margin-top: 3px;
  color: #7c8795;
  font-size: 11px;
  line-height: 1.4;
}
.scan-arrow {
  width: 16px;
  flex: 0 0 auto;
  fill: none;
  stroke: #8b96a4;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.section-heading {
  margin-top: 22px;
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

.recommendation-list {
  margin-top: 14px;
  display: grid;
  gap: 9px;
  list-style: none;
  padding: 0;
}

.recommendation-list > li {
  min-width: 0;
}

.recommendation-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 76px;
  padding: 10px;
  border: 1px solid #dce2eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #14233a;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.recommendation-card.selected {
  border-color: #142b4c;
  box-shadow: 0 0 0 3px rgba(20, 43, 76, 0.08);
}

.select-button {
  min-width: 0;
  padding: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  text-align: left;
}
.select-button img,
.thumb-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 9px;
  flex: 0 0 auto;
  object-fit: cover;
}
.thumb-placeholder {
  display: grid;
  place-items: center;
  color: #9b6a36;
  background: linear-gradient(145deg, #eee2ca, #d9cab0);
  font-size: 21px;
}
.card-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.distance {
  color: #c46c18;
  font-size: 10px;
  font-weight: 700;
}
.card-body strong {
  margin-top: 3px;
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-link {
  min-width: 50px;
  flex: 0 0 50px;
  min-height: 32px;
  border: 1px solid #cbd3df;
  border-radius: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #34465f;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}

.recommendation-skeleton {
  height: 76px;
  border-radius: 12px;
  background: linear-gradient(90deg, #edf0f4 25%, #f7f8fb 50%, #edf0f4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.empty-state {
  margin-top: 14px;
  padding: 22px;
  border: 1px dashed #cbd3df;
  color: #75808e;
  background: #fff;
  font-size: 12px;
  text-align: center;
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
