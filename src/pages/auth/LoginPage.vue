<script setup lang="ts">
import axios from 'axios'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const noticeMessage = ref(route.query.registered === 'true' ? '회원가입이 완료되었습니다.' : '')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const canSubmit = computed(
  () => email.value.trim().length > 0 && password.value.length > 0 && !isSubmitting.value,
)

async function submitLogin() {
  errorMessage.value = ''
  noticeMessage.value = ''

  const normalizedEmail = email.value.trim()
  if (!emailPattern.test(normalizedEmail)) {
    errorMessage.value = '올바른 이메일 주소를 입력해 주세요.'
    return
  }

  if (!password.value) {
    errorMessage.value = '비밀번호를 입력해 주세요.'
    return
  }

  isSubmitting.value = true

  try {
    await userStore.login(normalizedEmail, password.value)
    await router.replace('/')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value =
        error.response?.data?.message ||
        (error.response?.status === 401
          ? '이메일 또는 비밀번호를 확인해 주세요.'
          : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } else {
      errorMessage.value = error instanceof Error ? error.message : '로그인에 실패했습니다.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function showPendingNotice(feature: string) {
  errorMessage.value = ''
  noticeMessage.value = `${feature} 기능은 준비 중입니다.`
}
</script>

<template>
  <main class="login-page">
    <section class="brand" aria-labelledby="brand-title">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" role="img">
          <path d="M26 69 46 25c1.8-4 7.3-4 9.1 0L75 69" />
          <path d="M35 71c8.2-7.2 18.2-7.2 27 0" />
          <circle cx="50.5" cy="43.5" r="5.8" />
        </svg>
      </div>
      <h1 id="brand-title">HisTour</h1>
      <p>“여기에서 무슨 일이?”</p>
    </section>

    <section class="login-card" aria-label="로그인">
      <form novalidate @submit.prevent="submitLogin">
        <div class="field-group">
          <label for="email">이메일</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 5.5h17v13h-17z" />
              <path d="m4.5 7 7.5 6 7.5-6" />
            </svg>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="example@histour.com"
              :aria-invalid="Boolean(errorMessage)"
            />
          </div>
        </div>

        <div class="field-group">
          <label for="password">비밀번호</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="1.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <circle cx="12" cy="15.5" r="1" />
            </svg>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="비밀번호를 입력해 주세요"
              :aria-invalid="Boolean(errorMessage)"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="form-message error" role="alert">{{ errorMessage }}</p>
        <p v-else-if="noticeMessage" class="form-message" role="status">{{ noticeMessage }}</p>

        <button class="login-button" type="submit" :disabled="!canSubmit">
          <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
          <template v-else>
            <span>로그인</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5h8v14h-8" />
              <path d="m5 12 8 0m-3-3 3 3-3 3" />
            </svg>
          </template>
          <span class="sr-only" v-if="isSubmitting">로그인 중</span>
        </button>
      </form>
    </section>

    <footer class="login-footer">
      <p>
        처음이신가요?
        <RouterLink to="/register">회원가입</RouterLink>
      </p>
      <nav aria-label="정책 링크">
        <button type="button" @click="showPendingNotice('개인정보처리방침')">
          개인정보처리방침
        </button>
        <span aria-hidden="true"></span>
        <button type="button" @click="showPendingNotice('이용약관')">이용약관</button>
      </nav>
    </footer>
  </main>
</template>

<style scoped>
.login-page {
  width: min(100%, var(--mobile-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  padding: max(56px, 8vh) 18px 32px;
  color: var(--color-text-base);
  background:
    radial-gradient(circle at 50% 53%, rgba(255, 255, 255, 0.92) 0 22%, transparent 48%),
    var(--color-bg);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-mark {
  display: grid;
  width: 88px;
  height: 88px;
  margin-bottom: 27px;
  border-radius: 19px;
  place-items: center;
  background: var(--color-primary-container);
  box-shadow: var(--shadow-md);
}

.brand-mark svg {
  width: 66px;
  height: 66px;
}

.brand-mark path {
  fill: none;
  stroke: var(--color-accent-pale);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 8;
}

.brand-mark circle {
  fill: var(--color-accent);
}

.brand h1 {
  color: var(--color-primary-dark);
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1px;
}

.brand p {
  margin-top: 19px;
  color: var(--color-on-surface-variant);
  font-size: 25px;
  font-style: italic;
  font-weight: 750;
  letter-spacing: -1.5px;
}

.login-card {
  margin-top: clamp(50px, 8vh, 72px);
  padding: 31px 30px 30px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-md);
}

.field-group + .field-group {
  margin-top: 23px;
}

label,
.text-button {
  color: var(--color-on-surface-variant);
  font-size: 14px;
}

.text-button,
.login-footer button {
  border: 0;
  background: none;
  cursor: pointer;
}

.text-button {
  color: var(--color-on-primary-container);
}

.input-wrap {
  display: flex;
  height: 56px;
  margin-top: 10px;
  border: 1px solid var(--color-outline);
  border-radius: 2px;
  align-items: center;
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
}

.input-wrap:focus-within {
  border-color: var(--color-primary-container);
  box-shadow: 0 0 0 3px rgba(26, 43, 72, 0.1);
}

.input-wrap svg {
  width: 21px;
  margin: 0 15px;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--color-text-subtle);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.input-wrap input {
  width: 100%;
  height: 100%;
  padding-right: 12px;
  border: 0;
  outline: 0;
  color: var(--color-primary-container);
  background: transparent;
  font-size: 17px;
}

.input-wrap input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.form-message {
  min-height: 18px;
  margin-top: 14px;
  color: var(--color-on-surface-variant);
  font-size: 12px;
}

.form-message.error {
  color: var(--color-error);
}

.login-button {
  display: flex;
  width: 100%;
  height: 58px;
  margin-top: 33px;
  border: 0;
  border-radius: 2px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-on-primary);
  background: var(--color-primary-container);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  font-size: 17px;
  transition:
    background var(--transition),
    transform var(--transition-fast);
}

.login-button:hover:not(:disabled) {
  background: var(--color-primary-gradient);
}

.login-button:active:not(:disabled) {
  transform: translateY(1px);
}

.login-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.login-button svg {
  width: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.spinner {
  width: 21px;
  height: 21px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--color-on-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.login-footer {
  margin-top: 40px;
  text-align: center;
}

.login-footer p {
  color: var(--color-on-surface-variant);
  font-size: 14px;
}

.login-footer p a {
  margin-left: 4px;
  color: var(--color-primary-container);
  font-weight: 700;
  text-decoration: none;
}

.login-footer nav {
  display: flex;
  margin-top: 22px;
  align-items: center;
  justify-content: center;
  gap: 19px;
}

.login-footer nav button {
  color: var(--color-text-subtle);
  font-size: 12px;
}

.login-footer nav span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-outline-variant);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 360px) {
  .login-page {
    padding-inline: 14px;
  }

  .login-card {
    padding-inline: 22px;
  }

  .brand p {
    font-size: 22px;
  }
}

@media (min-height: 900px) {
  .login-page {
    padding-top: 82px;
  }
}
</style>
