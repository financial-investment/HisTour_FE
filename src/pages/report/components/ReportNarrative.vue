<script setup lang="ts">
import { normalizeAssetUrl } from '@/utils/assetUrl'

defineProps<{
  thumbnailUrl: string | null
  thumbnailAlt: string
  paragraphs: string[]
}>()
</script>

<template>
  <section class="narrative-section">
    <div class="artifact-preview">
      <img
        v-if="thumbnailUrl"
        :src="normalizeAssetUrl(thumbnailUrl)"
        :alt="thumbnailAlt"
      />
      <div v-else class="image-fallback">HisTour</div>
      <span>HisTour 여행 기록</span>
    </div>

    <article class="narrative-copy">
      <div class="section-kicker">
        <span>✦</span>
        <h2>여행 요약</h2>
      </div>
      <p v-for="paragraph in paragraphs" :key="paragraph">{{ paragraph }}</p>
    </article>
  </section>
</template>

<style scoped>
.narrative-section {
  display: grid;
  gap: 26px;
  margin-bottom: 54px;
}

.artifact-preview {
  position: relative;
  aspect-ratio: 1 / 1;
  border: 1px solid #c5c6ce;
  padding: 14px;
  background: #fff;
}

.artifact-preview img,
.image-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.8) contrast(1.1);
}

.image-fallback {
  display: grid;
  place-items: center;
  color: #8293b5;
  background: #eef4ff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
}

.artifact-preview > span {
  position: absolute;
  right: 24px;
  bottom: 24px;
  padding: 9px 12px;
  color: #fff;
  background: rgba(26, 43, 72, 0.92);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.section-kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-kicker h2 {
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.narrative-copy p {
  color: #44474d;
  font-size: 15px;
  line-height: 1.75;
}

.narrative-copy p + p {
  margin-top: 14px;
}
</style>
