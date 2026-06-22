<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  periods: { label: string; count: number }[]
  isLoading: boolean
}>()

const COLORS = [
  '#1E3A5F',
  '#C4923A',
  '#5B8A72',
  '#8B4513',
  '#6B5B8A',
  '#4A7C9E',
  '#A0522D',
  '#2E7D6B',
]

const CX = 65
const CY = 65
const OUTER_R = 60
const INNER_R = 38
const GAP = 0.5

const hoveredIndex = ref<number | null>(null)

const total = computed(() => props.periods.reduce((s, p) => s + p.count, 0))

function polarToXY(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

const segments = computed(() => {
  if (total.value === 0) return []
  let acc = 0
  return props.periods.map((p, i) => {
    const startAngle = (acc / total.value) * 360 + GAP
    acc += p.count
    const endAngle = (acc / total.value) * 360 - GAP
    const large = endAngle - startAngle > 180 ? 1 : 0
    const o1 = polarToXY(startAngle, OUTER_R)
    const o2 = polarToXY(endAngle, OUTER_R)
    const i1 = polarToXY(endAngle, INNER_R)
    const i2 = polarToXY(startAngle, INNER_R)
    return {
      d: `M ${o1.x} ${o1.y} A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${i2.x} ${i2.y} Z`,
      color: COLORS[i % COLORS.length],
      label: p.label,
      count: p.count,
    }
  })
})

const holeText = computed(() => {
  if (hoveredIndex.value === null) return null
  const item = props.periods[hoveredIndex.value]
  if (!item) return null
  return { count: item.count, label: item.label }
})
</script>

<template>
  <section class="content-section">
    <p class="section-label">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2 13h12M3 10h10M5 8V4h6v4M3 4h10L8 1 3 4Z" />
        <path d="M6.5 6v2M8 6v2M9.5 6v2" />
      </svg>
      탐방한 시대
    </p>

    <div v-if="isLoading" class="skeleton-wrap">
      <div class="skeleton-donut" />
      <div class="skeleton-legend">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
    </div>

    <div v-else-if="periods.length > 0" class="chart-wrap">
      <div class="donut-wrap">
        <svg viewBox="0 0 130 130" class="donut-svg">
          <path
            v-for="(seg, i) in segments"
            :key="i"
            :d="seg.d"
            :fill="seg.color"
            :opacity="hoveredIndex === null || hoveredIndex === i ? 1 : 0.35"
            class="segment"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = null"
          />
        </svg>
        <div class="donut-hole">
          <Transition name="fade" mode="out-in">
            <div v-if="holeText" :key="holeText.label" class="hole-content">
              <span class="hole-count">{{ holeText.count }}</span>
              <span class="hole-label">{{ holeText.label }}</span>
            </div>
          </Transition>
        </div>
      </div>

      <ul class="legend">
        <li v-for="(item, i) in periods" :key="item.label" class="legend-item">
          <span class="dot" :style="{ background: COLORS[i % COLORS.length] }" />
          <span class="legend-label">{{ item.label }}</span>
        </li>
      </ul>
    </div>

    <p v-else class="empty-sub">방문 기록이 없어요.</p>
  </section>
</template>

<style scoped>
.content-section {
  padding: 24px 20px 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-outline);
}
.section-label svg {
  width: 13px;
}

.empty-sub {
  font-size: 13px;
  color: var(--color-outline);
  padding: 8px 0;
}

.chart-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.donut-wrap {
  position: relative;
  flex-shrink: 0;
  width: 130px;
  height: 130px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.segment {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.donut-hole {
  position: absolute;
  inset: 29px;
  border-radius: 50%;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.hole-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.3;
}

.hole-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-on-surface);
}

.hole-label {
  font-size: 9px;
  font-weight: 500;
  color: var(--color-outline);
  white-space: nowrap;
}

.legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-on-surface);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.skeleton-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.skeleton-donut {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-row {
  width: 90px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
