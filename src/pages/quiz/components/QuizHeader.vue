<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  hasResult: boolean
  progressPercent: number
}>()

const router = useRouter()
</script>

<template>
  <header class="quiz-header">
    <button type="button" aria-label="뒤로 가기" @click="router.back()">×</button>
    <strong>HisTour</strong>
    <div v-if="!props.hasResult" class="session-meter">
      <span>QUIZ SESSION</span>
      <i><b :style="{ width: `${progressPercent}%` }"></b></i>
    </div>
    <RouterLink v-else to="/" aria-label="홈으로 이동">⌂</RouterLink>
  </header>
</template>

<style scoped>
.quiz-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  height: 64px;
  margin: 0 -18px;
  padding: 0 18px;
  border-bottom: 1px solid #d9dee8;
  background: rgba(245, 247, 251, 0.96);
  backdrop-filter: blur(14px);
}

.quiz-header button,
.quiz-header a {
  color: #031632;
  background: transparent;
  font-size: 26px;
  text-decoration: none;
}

.quiz-header strong {
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
}

.session-meter {
  display: grid;
  justify-items: end;
}

.session-meter span {
  color: #5c5f60;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.session-meter i {
  display: block;
  width: 96px;
  height: 5px;
  margin-top: 5px;
  border-radius: 999px;
  overflow: hidden;
  background: #dce4f0;
}

.session-meter b {
  display: block;
  height: 100%;
  background: #031632;
}
</style>
