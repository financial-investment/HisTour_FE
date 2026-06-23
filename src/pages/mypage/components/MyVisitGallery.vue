<script setup lang="ts">
import { computed } from 'vue'
import type { VisitLogResponse } from '@/types/api'
import ImageCarousel from '@/components/common/ImageCarousel.vue'
import type { CarouselItem } from '@/components/common/ImageCarousel.vue'

const props = defineProps<{
  logs: VisitLogResponse[]
  isLoading: boolean
}>()

const carouselItems = computed<CarouselItem[]>(() =>
  props.logs
    .filter((l) => l.photoUrl)
    .map((l) => ({
      url: l.photoUrl!,
      label: l.heritageName,
      linkTo: `/heritage/${l.heritageId}`,
    })),
)
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
        <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
        <circle cx="5.5" cy="6.5" r="1.2" />
        <path d="M1.5 10.5l3-3 2.5 2.5 2.5-2 4 4" />
      </svg>
      방문한 문화재
    </p>

    <p v-if="!isLoading && carouselItems.length === 0" class="empty-sub">
      촬영한 사진이 없어요.
    </p>

    <ImageCarousel v-else :items="carouselItems" :is-loading="isLoading" />
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

.empty-sub {
  font-size: 13px;
  color: var(--color-outline);
  padding: 8px 0;
}
</style>
