<script setup lang="ts">
import ImageCarousel, { type CarouselItem } from '@/components/common/ImageCarousel.vue'

defineProps<{
  items: CarouselItem[]
}>()
</script>

<template>
  <section class="records-section">
    <div class="section-heading">
      <div>
        <h2>방문한 유적지</h2>
        <p>여행 중 다녀온 장소</p>
      </div>
    </div>

    <ImageCarousel
      v-if="items.length"
      :items="items"
      :height="240"
      :show-controls="true"
    />

    <div v-else class="empty-panel">
      <strong>방문 기록이 비어 있어요</strong>
      <p>완료된 여행의 방문 문화재가 있으면 리포트에 아카이브 카드로 표시됩니다.</p>
    </div>
  </section>
</template>

<style scoped>
.records-section {
  margin-bottom: 52px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.section-heading h2 {
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.section-heading p {
  color: #5c5f60;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.empty-panel {
  padding: 18px;
  border: 1px solid #c5c6ce;
  border-radius: 4px;
  background: #fff;
}

.empty-panel strong {
  color: #031632;
  font-size: 18px;
}

.empty-panel p {
  margin: 8px 0 0;
  color: #5c5f60;
  font-size: 14px;
  line-height: 1.5;
}
</style>
