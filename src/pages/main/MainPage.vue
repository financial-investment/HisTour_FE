<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const isLoggingOut = ref(false)
const profileError = ref('')

onMounted(async () => {
  if (userStore.user) return

  try {
    await userStore.loadProfile()
  } catch {
    profileError.value = '사용자 정보를 불러오지 못했어요.'
  }
})

async function handleLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    await userStore.logout()
  } finally {
    await router.replace('/login')
    isLoggingOut.value = false
  }
}
</script>

<template>
  <main class="main-page">
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
      <button class="logout-button" type="button" :disabled="isLoggingOut" @click="handleLogout">
        {{ isLoggingOut ? '로그아웃 중' : '로그아웃' }}
      </button>
    </header>

    <section class="welcome">
      <p>오늘은 어떤 이야기를 만나볼까요?</p>
      <h1>
        <template v-if="userStore.user">
          {{ userStore.user.nickname }}님,<br />역사 속으로 떠나봐요.
        </template>
        <template v-else>반가워요,<br />역사 속으로 떠나봐요.</template>
      </h1>
      <small v-if="profileError">{{ profileError }}</small>
      <div class="route-line" aria-hidden="true">
        <span></span><i></i><span></span><i></i><span></span>
      </div>
    </section>

    <RouterLink class="start-card" to="/trip">
      <div>
        <span>새로운 여행</span>
        <h2>내 주변의 역사를<br />발견해 보세요</h2>
        <p>위치를 기반으로 가까운 문화유산을 찾아드려요.</p>
      </div>
      <span class="start-arrow" aria-hidden="true">→</span>
      <svg class="landmark" viewBox="0 0 150 120" aria-hidden="true">
        <path d="M20 97h112M30 88h90M40 82V50h70v32M33 50h84L75 18 33 50Z" />
        <path d="M52 55v25M75 55v25M98 55v25" />
        <circle cx="75" cy="37" r="4" />
      </svg>
    </RouterLink>

    <section class="quick-section" aria-labelledby="quick-title">
      <div class="section-title">
        <h2 id="quick-title">빠른 메뉴</h2>
        <span>여행의 기록을 이어가세요</span>
      </div>

      <div class="quick-grid">
        <RouterLink to="/trip" class="quick-card">
          <span class="quick-icon map" aria-hidden="true">⌖</span>
          <strong>내 여행</strong>
          <small>여행 기록 보기</small>
        </RouterLink>
        <RouterLink to="/quiz" class="quick-card">
          <span class="quick-icon quiz" aria-hidden="true">?</span>
          <strong>역사 퀴즈</strong>
          <small>배운 내용 복습</small>
        </RouterLink>
        <RouterLink to="/mypage" class="quick-card wide">
          <span class="quick-icon report" aria-hidden="true">✓</span>
          <div>
            <strong>나의 활동</strong>
            <small>프로필과 지난 여행을 확인해 보세요</small>
          </div>
          <span class="chevron" aria-hidden="true">›</span>
        </RouterLink>
      </div>
    </section>

  </main>
</template>

<style scoped>
.main-page {
  --navy: #172f50;
  width: min(100%, var(--mobile-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 0 20px 96px;
  color: #17263a;
  background: #f7f8fc;
}

.top-bar {
  display: flex;
  height: 76px;
  align-items: center;
  justify-content: space-between;
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #0c2949;
  text-decoration: none;
}

.wordmark strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 21px;
}

.brand-icon {
  display: grid;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  place-items: center;
  background: var(--navy);
}

.brand-icon svg {
  width: 29px;
}

.brand-icon path {
  fill: none;
  stroke: #f9ead7;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 8;
}

.brand-icon circle {
  fill: #e87505;
}

.logout-button {
  padding: 8px 11px;
  border: 1px solid #dfe3e9;
  border-radius: 8px;
  color: #737b86;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

.logout-button:disabled {
  opacity: 0.6;
}

.welcome {
  position: relative;
  min-height: 202px;
  padding: 31px 24px;
  border-radius: 18px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #173152 0%, #24476c 100%);
  box-shadow: 0 13px 30px rgba(20, 47, 79, 0.17);
}

.welcome::after {
  position: absolute;
  width: 180px;
  height: 180px;
  right: -70px;
  top: -72px;
  border: 35px solid rgba(255, 255, 255, 0.035);
  border-radius: 50%;
  content: "";
}

.welcome p {
  color: #bfcce0;
  font-size: 12px;
}

.welcome h1 {
  margin-top: 11px;
  font-size: 25px;
  line-height: 1.35;
  letter-spacing: -1px;
}

.welcome small {
  display: block;
  margin-top: 8px;
  color: #f4c99e;
}

.route-line {
  position: absolute;
  right: 22px;
  bottom: 23px;
  display: flex;
  align-items: center;
}

.route-line span {
  width: 9px;
  height: 9px;
  border: 2px solid #f49a3a;
  border-radius: 50%;
}

.route-line i {
  width: 28px;
  border-top: 1px dashed rgba(255, 255, 255, 0.45);
}

.start-card {
  position: relative;
  display: block;
  min-height: 176px;
  margin-top: 18px;
  padding: 25px 22px;
  border: 1px solid #eee1d4;
  border-radius: 16px;
  overflow: hidden;
  color: inherit;
  background: #fffaf4;
  text-decoration: none;
}

.start-card > div {
  position: relative;
  z-index: 1;
}

.start-card div > span {
  color: #de720a;
  font-size: 11px;
  font-weight: 700;
}

.start-card h2 {
  margin-top: 7px;
  color: #213651;
  font-size: 20px;
  line-height: 1.35;
}

.start-card p {
  width: 200px;
  margin-top: 9px;
  color: #85888d;
  font-size: 11px;
  line-height: 1.5;
}

.start-arrow {
  position: absolute;
  right: 19px;
  top: 18px;
  z-index: 1;
  color: #d76c05;
  font-size: 23px;
}

.landmark {
  position: absolute;
  width: 132px;
  right: -10px;
  bottom: -10px;
  fill: none;
  stroke: #edc9a2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
  opacity: 0.55;
}

.quick-section {
  margin-top: 31px;
}

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
}

.section-title h2 {
  color: #172f50;
  font-size: 18px;
}

.section-title span {
  color: #9a9ea5;
  font-size: 10px;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
  margin-top: 14px;
}

.quick-card {
  display: flex;
  min-height: 128px;
  padding: 17px;
  border: 1px solid #e5e7ec;
  border-radius: 14px;
  flex-direction: column;
  color: #283a50;
  background: #fff;
  text-decoration: none;
}

.quick-icon {
  display: grid;
  width: 35px;
  height: 35px;
  margin-bottom: 13px;
  border-radius: 10px;
  place-items: center;
  font-size: 18px;
  font-weight: 700;
}

.quick-icon.map {
  color: #2c608f;
  background: #e8f1fa;
}

.quick-icon.quiz {
  color: #d5791c;
  background: #fff0df;
}

.quick-icon.report {
  margin: 0 15px 0 0;
  color: #4b7c5a;
  background: #e9f5ec;
}

.quick-card strong {
  font-size: 14px;
}

.quick-card small {
  margin-top: 5px;
  color: #969ba2;
  font-size: 10px;
}

.quick-card.wide {
  min-height: 74px;
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
}

.quick-card.wide div {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.chevron {
  color: #a4a8ae;
  font-size: 25px;
}

@media (max-width: 360px) {
  .main-page {
    padding-inline: 14px;
  }

  .welcome {
    padding-inline: 20px;
  }
}
</style>
