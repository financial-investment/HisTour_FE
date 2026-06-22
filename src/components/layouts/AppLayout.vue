<script setup lang="ts">
import BottomNav from '@/components/common/BottomNav.vue'
</script>

<template>
  <div class="app-layout">
    <main class="app-content">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1;
  padding-bottom: 60px; /* bottom nav 높이만큼 */
}
</style>
