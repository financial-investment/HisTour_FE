<script setup lang="ts">
import { computed, ref } from 'vue'
import { applyFallbackAsset, normalizeAssetUrl } from '@/utils/assetUrl'

export interface CarouselItem {
  url: string
  label?: string
  linkTo?: string
  fallbackUrl?: string | null
}

const props = defineProps<{
  items: CarouselItem[]
  height?: number
  isLoading?: boolean
  showControls?: boolean
}>()

const h = computed(() => props.height ?? 220)
const currentIndex = ref(0)
const carouselRef = ref<HTMLElement | null>(null)

function onScroll() {
  if (!carouselRef.value) return
  currentIndex.value = Math.round(carouselRef.value.scrollLeft / carouselRef.value.clientWidth)
}

function goTo(index: number) {
  if (!carouselRef.value) return
  carouselRef.value.scrollTo({ left: index * carouselRef.value.clientWidth, behavior: 'smooth' })
}

function moveBy(direction: -1 | 1) {
  const maxIndex = props.items.length - 1
  const nextIndex = Math.min(Math.max(currentIndex.value + direction, 0), maxIndex)
  goTo(nextIndex)
}

const showDots = computed(() => props.items.length <= 10)
</script>

<template>
  <div class="carousel-wrap">
    <!-- 로딩 -->
    <div v-if="isLoading" class="skeleton" :style="{ height: `${h}px` }" />

    <!-- 캐러셀 -->
    <template v-else-if="items.length > 0">
      <div
        ref="carouselRef"
        class="carousel"
        :style="{ height: `${h}px` }"
        @scroll.passive="onScroll"
      >
        <component
          :is="item.linkTo ? 'RouterLink' : 'div'"
          v-for="(item, i) in items"
          :key="i"
          :to="item.linkTo"
          class="slide"
        >
          <img
            :src="normalizeAssetUrl(item.url)"
            :alt="item.label ?? '이미지'"
            class="slide-img"
            @error="applyFallbackAsset($event, item.fallbackUrl)"
          />
          <div v-if="item.label" class="slide-overlay">
            <span class="slide-label">{{ item.label }}</span>
          </div>
        </component>
      </div>

      <template v-if="showControls && items.length > 1">
        <button
          type="button"
          class="carousel-control carousel-control--prev"
          :disabled="currentIndex === 0"
          aria-label="Previous image"
          @click="moveBy(-1)"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <button
          type="button"
          class="carousel-control carousel-control--next"
          :disabled="currentIndex === items.length - 1"
          aria-label="Next image"
          @click="moveBy(1)"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
      </template>

      <!-- 인디케이터 -->
      <div class="indicator">
        <template v-if="showDots">
          <button
            v-for="(_, i) in items"
            :key="i"
            class="dot"
            :class="{ 'dot--active': i === currentIndex }"
            :aria-label="`${i + 1}번째`"
            @click="goTo(i)"
          />
        </template>
        <span v-else class="counter">{{ currentIndex + 1 }} / {{ items.length }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.carousel-wrap {
  position: relative;
  width: 100%;
}

.skeleton {
  width: 100%;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  border-radius: 16px;
}
.carousel::-webkit-scrollbar {
  display: none;
}

.slide {
  flex-shrink: 0;
  position: relative;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  display: block;
  text-decoration: none;
  overflow: hidden;
  border-radius: 16px;
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.slide:hover .slide-img {
  transform: scale(1.03);
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(3, 22, 50, 0.7) 0%, transparent 50%);
  display: flex;
  align-items: flex-end;
  padding: 16px;
  pointer-events: none;
}

.slide-label {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.carousel-control {
  position: absolute;
  top: calc(50% - 13px);
  z-index: 2;
  display: grid;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: rgba(3, 22, 50, 0.7);
  box-shadow: 0 4px 12px rgba(3, 22, 50, 0.2);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.carousel-control:hover:not(:disabled) {
  transform: scale(1.05);
}

.carousel-control:disabled {
  cursor: default;
  opacity: 0.35;
}

.carousel-control svg {
  width: 17px;
  height: 17px;
}

.carousel-control--prev {
  left: 10px;
}

.carousel-control--next {
  right: 10px;
}

.indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  min-height: 16px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: var(--color-outline-variant);
  cursor: pointer;
  padding: 0;
  transition:
    background 0.2s,
    transform 0.2s;
}
.dot--active {
  background: var(--color-primary-container);
  transform: scale(1.4);
}

.counter {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-outline);
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
