<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  imageUrl: string | null
  altText: string
}>()

const router = useRouter()
</script>

<template>
  <div class="hero">
    <img v-if="imageUrl" :src="imageUrl" :alt="altText" class="hero-img" />
    <div v-else class="hero-placeholder">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M10 44h28M13 36h22M17 32V18h14v14M12 18h24L24 6 12 18Z" />
      </svg>
    </div>
    <div class="hero-overlay" />
    <button class="back-btn" aria-label="뒤로가기" @click="router.back()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 280px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-surface-high);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-placeholder svg {
  width: 52px;
  color: var(--color-outline-variant);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 0%, transparent 40%);
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.back-btn svg {
  width: 20px;
}
</style>
