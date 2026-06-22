<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Active Trip', path: '/trip', icon: 'trip' },
  { label: 'Profile', path: '/mypage', icon: 'profile' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const activeTrip = computed(() => route.path.startsWith('/trip'))
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="nav-item"
      :class="{ active: isActive(tab.path) }"
    >
      <!-- Home icon -->
      <svg v-if="tab.icon === 'home'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          v-if="!isActive(tab.path)"
          d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9V16H15V21H18C18.55 21 19 20.55 19 20V10M9 21H15"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        />
        <path
          v-else
          d="M12 3L3 10V20C3 20.55 3.45 21 4 21H9V16H15V21H20C20.55 21 21 20.55 21 20V10L12 3Z"
          fill="currentColor"
        />
      </svg>

      <!-- Active Trip (navigation arrow) icon -->
      <svg v-if="tab.icon === 'trip'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          v-if="!isActive(tab.path)"
          d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        />
        <path
          v-else
          d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"
          fill="currentColor"
        />
      </svg>

      <!-- Profile icon -->
      <svg v-if="tab.icon === 'profile'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          v-if="!isActive(tab.path)"
          d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
          fill="none"
        />
        <path
          v-else
          d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
          fill="currentColor"
        />
      </svg>

      <span>{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--mobile-max-width);
  height: 60px;
  background: var(--color-surface-lowest);
  border-top: 1px solid var(--color-outline-variant);
  display: flex;
  align-items: center;
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--color-outline);
  text-decoration: none;
  transition: color var(--transition-fast);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item svg {
  width: 22px;
  height: 22px;
}

.nav-item span {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.nav-item.active {
  color: var(--color-primary);
}
</style>
