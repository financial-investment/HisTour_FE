<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <Teleport to="body">
    <div class="loading-overlay">
      <div class="loading-box">
        <div class="spinner" />
        <p v-if="message" class="loading-message">{{ message }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 22, 50, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-message {
  color: #ffffff;
  font-size: var(--text-body-sm);
  font-weight: 500;
  text-align: center;
  max-width: 200px;
  line-height: 1.5;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
