<script setup lang="ts">
const props = defineProps<{
  items: { category: string; visited: number; total: number }[]
  isLoading: boolean
}>()

function barWidth(item: { visited: number; total: number }): number {
  if (item.total === 0) return 0
  return (item.visited / item.total) * 100
}

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
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3l2 2" />
      </svg>
      얼마나 남았을까?
      <span class="section-sub">아직 갈 곳이 더 많아</span>
    </p>

    <div v-if="isLoading" class="skeleton-wrap">
      <div v-for="i in 4" :key="i" class="skeleton-bar"></div>
    </div>

    <div v-else-if="items.length > 0" class="bar-chart">
      <div v-for="(item, i) in items" :key="item.category" class="bar-row">
        <span class="bar-label">{{ item.category }}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            :class="{ 'bar-fill--top': i === 0 }"
            :style="{ width: `${barWidth(item)}%` }"
          ></div>
        </div>
        <span class="bar-count">{{ item.visited }}<span class="bar-total">/{{ item.total }}</span></span>
      </div>
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
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-outline);
}
.section-label svg {
  width: 13px;
}

.section-sub {
  margin-left: 4px;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--color-outline-variant);
}

.empty-sub {
  font-size: 13px;
  color: var(--color-outline);
  padding: 8px 0;
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-bar {
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-row {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  align-items: center;
  gap: 10px;
}

.bar-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.bar-track {
  height: 10px;
  border-radius: 99px;
  background: var(--color-surface-high);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--color-outline);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar-fill--top {
  background: var(--color-primary-container);
}

.bar-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-outline);
  white-space: nowrap;
}

.bar-total {
  font-weight: 400;
  color: var(--color-outline-variant);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
