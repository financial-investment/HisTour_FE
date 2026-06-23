<script setup lang="ts">
defineProps<{
  isLoggingOut?: boolean
}>()

defineEmits<{ logout: [] }>()
</script>

<template>
  <header class="top-bar">
    <RouterLink class="wordmark" to="/" aria-label="HisTour 홈">
      <span class="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 96 96">
          <path d="M26 69 46 25c1.8-4 7.3-4 9.1 0L75 69" />
          <path d="M35 71c8.2-7.2 18.2-7.2 27 0" />
          <circle cx="50.5" cy="43.5" r="5.8" />
        </svg>
      </span>
      <strong>HisTour</strong>
    </RouterLink>
    <button class="logout-button" type="button" :disabled="isLoggingOut" @click="$emit('logout')">
      {{ isLoggingOut ? '로그아웃 중…' : '로그아웃' }}
    </button>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: space-between;
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--color-primary-dark);
  text-decoration: none;
}

.wordmark strong {
  font-family: var(--font-serif);
  font-size: 20px;
  letter-spacing: -0.5px;
}

.brand-icon {
  display: grid;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  place-items: center;
  background: var(--color-primary-container);
}

.brand-icon svg {
  width: 27px;
}
.brand-icon path {
  fill: none;
  stroke: var(--color-accent-pale);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 8;
}
.brand-icon circle {
  fill: var(--color-accent);
}

.logout-button {
  padding: 7px 12px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 8px;
  color: var(--color-text-subtle);
  background: var(--color-surface-lowest);
  font-size: 12px;
  transition: background var(--transition);
}
.logout-button:hover:not(:disabled) {
  background: var(--color-surface-low);
}
.logout-button:disabled {
  opacity: 0.6;
}
</style>
