<script setup lang="ts">
defineProps<{
  nickname: string
  email: string | undefined
  completedCount: number
  totalVisits: number
  avgVisits: string
  isLoggingOut?: boolean
}>()

defineEmits<{ logout: [] }>()
</script>

<template>
  <section class="profile-header">
    <div class="profile-top">
      <div class="avatar" aria-hidden="true">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="20" cy="15" r="7" />
          <path d="M6 36c0-7.7 6.3-12 14-12s14 4.3 14 12" />
        </svg>
      </div>
      <div class="profile-info">
        <p class="profile-sub">나의 역사 여행</p>
        <h1 class="profile-name">{{ nickname }}</h1>
        <p class="profile-email">{{ email }}</p>
      </div>
      <button
        class="logout-btn"
        aria-label="로그아웃"
        :disabled="isLoggingOut"
        @click="$emit('logout')"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M13 15l4-5-4-5M17 10H7M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" />
        </svg>
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{{ completedCount }}</span>
        <span class="stat-label">완료 여행</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat-item">
        <span class="stat-value">{{ totalVisits }}</span>
        <span class="stat-label">방문 문화재</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat-item">
        <span class="stat-value">{{ avgVisits }}</span>
        <span class="stat-label">평균 방문 수</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-header {
  background: linear-gradient(150deg, var(--color-primary) 0%, var(--color-primary-container) 100%);
  color: var(--color-on-primary);
  padding: 52px 24px 0;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
}
.avatar svg {
  width: 32px;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-sub {
  font-size: 11px;
  color: var(--color-on-primary-container);
  letter-spacing: 0.04em;
}

.profile-name {
  margin-top: 3px;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  margin-top: 3px;
  font-size: 12px;
  color: var(--color-on-primary-container);
  opacity: 0.8;
}

.logout-btn {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: background var(--transition);
}
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.logout-btn:disabled {
  cursor: wait;
  opacity: 0.55;
}
.logout-btn svg {
  width: 18px;
}

.stats-row {
  display: flex;
  align-items: center;
  margin-top: 28px;
  padding: 18px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-on-primary-container);
  opacity: 0.85;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.15);
}
</style>
