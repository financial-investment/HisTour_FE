<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { tripApi } from '@/api/tripApi'
import type { TripResponse } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()
const trips = ref<TripResponse[]>([])
const isLoading = ref(false)

const completedTrips = computed(() =>
  trips.value
    .filter((t) => t.status === 'COMPLETED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
)

const totalVisits = computed(() => trips.value.reduce((sum, t) => sum + t.visitCount, 0))

const hasActiveTrip = computed(() => trips.value.some((t) => t.status === 'IN_PROGRESS'))

onMounted(async () => {
  if (!userStore.user) await userStore.loadProfile()
  isLoading.value = true
  try {
    trips.value = await tripApi.list()
  } catch {
    // 조용히 실패
  } finally {
    isLoading.value = false
  }
})

function formatDate(tripDate: string | null, createdAt: string) {
  const raw = tripDate ?? createdAt
  return raw.slice(0, 10).replace(/-/g, '.')
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <main class="mypage">
    <!-- 프로필 헤더 -->
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
          <h1 class="profile-name">{{ userStore.user?.nickname ?? '여행자' }}</h1>
          <p class="profile-email">{{ userStore.user?.email }}</p>
        </div>
        <button class="logout-btn" aria-label="로그아웃" @click="handleLogout">
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

      <!-- 통계 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ completedTrips.length }}</span>
          <span class="stat-label">완료 여행</span>
        </div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="stat-item">
          <span class="stat-value">{{ totalVisits }}</span>
          <span class="stat-label">방문 문화재</span>
        </div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="stat-item">
          <span class="stat-value">{{ hasActiveTrip ? '진행 중' : '없음' }}</span>
          <span class="stat-label">현재 여행</span>
        </div>
      </div>
    </section>

    <!-- 여행 기록 -->
    <section class="trips-section">
      <p class="section-label">
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
          <path d="M4 1.5v2M10 1.5v2M1.5 6h11" />
        </svg>
        완료한 여행
      </p>

      <!-- 로딩 스켈레톤 -->
      <template v-if="isLoading">
        <div v-for="i in 3" :key="i" class="skeleton"></div>
      </template>

      <!-- 여행 목록 -->
      <template v-else-if="completedTrips.length > 0">
        <RouterLink
          v-for="trip in completedTrips"
          :key="trip.tripId"
          :to="`/report/${trip.tripId}`"
          class="trip-card"
        >
          <div class="trip-card-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 22h14M7 18h10M9 14V8h6v6M8 8h8L12 3 8 8Z" />
              <path d="M11 11v3M13 11v3" />
            </svg>
          </div>
          <div class="trip-card-body">
            <h2 class="trip-title">{{ trip.title ?? '이름 없는 여행' }}</h2>
            <div class="trip-meta">
              <span>
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect x="1" y="1.5" width="10" height="9.5" rx="1.5" />
                  <path d="M3.5 0.5v2M8.5 0.5v2M1 5h10" />
                </svg>
                {{ formatDate(trip.tripDate, trip.createdAt) }}
              </span>
              <span>
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="5" r="2" />
                  <path d="M6 1a4 4 0 0 1 4 4c0 3-4 7-4 7S2 8 2 5a4 4 0 0 1 4-4z" />
                </svg>
                {{ trip.visitCount }}곳
              </span>
            </div>
          </div>
          <svg
            class="trip-arrow"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8h10M9 5l4 3-4 3" />
          </svg>
        </RouterLink>
      </template>

      <!-- 빈 상태 -->
      <div v-else class="empty-state">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10 44h28M13 36h22M17 32V18h14v14M12 18h24L24 6 12 18Z" />
          <path d="M20 23v7M24 23v7M28 23v7" />
        </svg>
        <p>아직 완료한 여행이 없어요.</p>
        <RouterLink to="/" class="start-link">여행 시작하기 →</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.mypage {
  width: min(100%, var(--mobile-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  padding-bottom: 96px;
  background: var(--color-bg);
}

/* ── 프로필 헤더 ── */
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
.logout-btn svg {
  width: 18px;
}

/* 통계 */
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

/* ── 여행 기록 ── */
.trips-section {
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
  width: 12px;
}

/* 여행 카드 */
.trip-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 16px;
  background: var(--color-surface-lowest);
  text-decoration: none;
  color: var(--color-on-surface);
  transition: background var(--transition);
}
.trip-card:hover {
  background: var(--color-surface-low);
}

.trip-card-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--color-surface-high);
  color: var(--color-primary-container);
}
.trip-card-icon svg {
  width: 22px;
}

.trip-card-body {
  flex: 1;
  min-width: 0;
}

.trip-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary-container);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trip-meta {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  font-size: 11px;
  color: var(--color-outline);
}
.trip-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}
.trip-meta svg {
  width: 11px;
  flex-shrink: 0;
}

.trip-arrow {
  flex-shrink: 0;
  width: 15px;
  color: var(--color-outline-variant);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 52px 20px;
  text-align: center;
}
.empty-state svg {
  width: 52px;
  color: var(--color-outline-variant);
}
.empty-state p {
  font-size: 14px;
  color: var(--color-outline);
}

.start-link {
  padding: 10px 22px;
  border-radius: 10px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity var(--transition);
}
.start-link:hover {
  opacity: 0.85;
}

/* 스켈레톤 */
.skeleton {
  height: 72px;
  margin-bottom: 8px;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    var(--color-surface-high) 25%,
    var(--color-surface-highest) 50%,
    var(--color-surface-high) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
