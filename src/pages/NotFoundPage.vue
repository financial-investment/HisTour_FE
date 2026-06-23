<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="content">
      <!-- 무너진 유적 일러스트 -->
      <div class="illustration" aria-hidden="true">
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 기단 -->
          <rect x="20" y="140" width="160" height="8" rx="2" fill="currentColor" opacity="0.15" />
          <rect x="30" y="133" width="140" height="7" rx="1.5" fill="currentColor" opacity="0.1" />

          <!-- 무너진 기둥 왼쪽 -->
          <rect x="38" y="72" width="16" height="61" rx="2" fill="currentColor" opacity="0.2" />
          <!-- 금 -->
          <path d="M44 90 L48 105 L44 120" stroke="currentColor" stroke-width="1" opacity="0.15" />

          <!-- 무너진 기둥 오른쪽 (더 짧게) -->
          <rect x="146" y="92" width="16" height="41" rx="2" fill="currentColor" opacity="0.2" />

          <!-- 쓰러진 기둥 조각들 -->
          <rect
            x="110"
            y="130"
            width="40"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.12"
            transform="rotate(-8 130 135)"
          />
          <rect
            x="55"
            y="126"
            width="28"
            height="9"
            rx="2"
            fill="currentColor"
            opacity="0.1"
            transform="rotate(5 69 131)"
          />

          <!-- 중앙 아치 (부분적으로 남은) -->
          <path
            d="M54 72 Q100 28 146 72"
            stroke="currentColor"
            stroke-width="5"
            stroke-linecap="round"
            opacity="0.22"
            fill="none"
          />
          <!-- 아치 끊긴 부분 표현 -->
          <path
            d="M54 72 Q74 44 92 38"
            stroke="currentColor"
            stroke-width="5"
            stroke-linecap="round"
            opacity="0.3"
            fill="none"
          />

          <!-- 지붕 남은 조각 왼쪽 -->
          <path
            d="M28 72 L54 72 L38 60 Z"
            fill="currentColor"
            opacity="0.18"
          />

          <!-- 돌 파편들 -->
          <rect x="80" y="136" width="8" height="5" rx="1" fill="currentColor" opacity="0.1" transform="rotate(-12 84 138)" />
          <rect x="160" y="134" width="5" height="4" rx="1" fill="currentColor" opacity="0.08" transform="rotate(6 162 136)" />
          <rect x="22" y="135" width="6" height="4" rx="1" fill="currentColor" opacity="0.08" transform="rotate(-5 25 137)" />

          <!-- 식물 (잡초) -->
          <path d="M94 133 C94 128 97 124 97 120" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.2" />
          <path d="M94 133 C94 128 91 123 90 119" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.2" />
          <path d="M120 133 C120 129 122 126 121 122" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.15" />
        </svg>
      </div>

      <!-- 404 뱃지 -->
      <div class="badge">404</div>

      <!-- 메시지 -->
      <h1 class="title">길을 잃으셨나요?</h1>
      <p class="description">
        찾으시는 페이지가 역사 속으로 사라진 것 같아요.<br />
        주소를 다시 확인하거나 홈으로 돌아가 보세요.
      </p>

      <!-- 버튼 -->
      <div class="actions">
        <RouterLink to="/" class="btn-primary">홈으로 돌아가기</RouterLink>
        <button class="btn-secondary" @click="router.back()">이전 페이지</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  width: min(100%, var(--mobile-max-width));
  margin: 0 auto;
  padding: 32px 24px;
  background: var(--color-bg);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
}

/* 일러스트 */
.illustration {
  width: 180px;
  color: var(--color-primary-container);
  margin-bottom: 8px;
}
.illustration svg {
  width: 100%;
}

/* 404 뱃지 */
.badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--color-outline-variant);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-outline);
  margin-bottom: 20px;
}

/* 제목 */
.title {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary-container);
  margin-bottom: 12px;
}

/* 설명 */
.description {
  font-size: 13px;
  line-height: 1.8;
  color: var(--color-outline);
  margin-bottom: 36px;
}

/* 버튼 */
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 260px;
}

.btn-primary {
  display: block;
  padding: 14px;
  border-radius: 12px;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  transition: opacity var(--transition);
}
.btn-primary:hover {
  opacity: 0.85;
}

.btn-secondary {
  padding: 14px;
  border-radius: 12px;
  border: 1.5px solid var(--color-outline-variant);
  background: transparent;
  color: var(--color-outline);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition);
}
.btn-secondary:hover {
  background: var(--color-surface-low);
}
</style>
