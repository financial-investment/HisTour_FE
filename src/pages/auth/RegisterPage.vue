<script setup lang="ts">
import axios from 'axios'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { signUp } from '@/api/auth'

const router = useRouter()

const nickname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const canSubmit = computed(
  () =>
    nickname.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    password.value.length > 0 &&
    passwordConfirm.value.length > 0 &&
    !isSubmitting.value,
)

async function submitSignUp() {
  errorMessage.value = ''
  const normalizedNickname = nickname.value.trim()
  const normalizedEmail = email.value.trim()

  if (!normalizedNickname) {
    errorMessage.value = '닉네임을 입력해 주세요.'
    return
  }

  if (!emailPattern.test(normalizedEmail)) {
    errorMessage.value = '올바른 이메일 주소를 입력해 주세요.'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = '비밀번호는 8자 이상이어야 합니다.'
    return
  }

  if (password.value !== passwordConfirm.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  isSubmitting.value = true

  try {
    await signUp({
      nickname: normalizedNickname,
      email: normalizedEmail,
      password: password.value,
      preferredLang: 'ko',
    })
    await router.replace({
      name: 'login',
      query: { registered: 'true', email: normalizedEmail },
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value =
        error.response?.data?.message ||
        '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    } else {
      errorMessage.value = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="signup-page">
    <header class="page-header">
      <RouterLink class="back-button" to="/login" aria-label="로그인으로 돌아가기">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 5-7 7 7 7" />
        </svg>
      </RouterLink>
      <div class="mini-brand" aria-hidden="true">
        <svg viewBox="0 0 96 96">
          <path d="M26 69 46 25c1.8-4 7.3-4 9.1 0L75 69" />
          <path d="M35 71c8.2-7.2 18.2-7.2 27 0" />
          <circle cx="50.5" cy="43.5" r="5.8" />
        </svg>
      </div>
      <span aria-hidden="true"></span>
    </header>

    <section class="intro" aria-labelledby="signup-title">
      <p>HisTour와 함께</p>
      <h1 id="signup-title">새로운 여행을 시작해요</h1>
      <span>간단한 정보만 입력하면 바로 시작할 수 있어요.</span>
    </section>

    <section class="signup-card" aria-label="회원가입">
      <form novalidate @submit.prevent="submitSignUp">
        <div class="field-group">
          <label for="nickname">닉네임</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
            </svg>
            <input
              id="nickname"
              v-model="nickname"
              name="nickname"
              type="text"
              maxlength="30"
              autocomplete="nickname"
              placeholder="사용할 닉네임"
            />
          </div>
        </div>

        <div class="field-group">
          <label for="signup-email">이메일</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 5.5h17v13h-17z" />
              <path d="m4.5 7 7.5 6 7.5-6" />
            </svg>
            <input
              id="signup-email"
              v-model="email"
              name="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="example@histour.com"
            />
          </div>
        </div>

        <div class="field-group">
          <label for="signup-password">비밀번호</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="1.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              id="signup-password"
              v-model="password"
              name="password"
              type="password"
              minlength="8"
              autocomplete="new-password"
              placeholder="8자 이상 입력해 주세요"
            />
          </div>
        </div>

        <div class="field-group">
          <label for="password-confirm">비밀번호 확인</label>
          <div class="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 4 4 10-10" />
            </svg>
            <input
              id="password-confirm"
              v-model="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autocomplete="new-password"
              placeholder="비밀번호를 다시 입력해 주세요"
              :aria-invalid="Boolean(errorMessage)"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="form-message" role="alert">{{ errorMessage }}</p>

        <button class="signup-button" type="submit" :disabled="!canSubmit">
          <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
          <span v-else>회원가입</span>
          <span v-if="isSubmitting" class="sr-only">회원가입 중</span>
        </button>
      </form>
    </section>

    <p class="login-link">이미 계정이 있나요? <RouterLink to="/login">로그인</RouterLink></p>
  </main>
</template>

<style scoped>
.signup-page {
  width: min(100%, var(--mobile-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 22px 18px 32px;
  color: var(--color-text-base);
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.9) 0 18%, transparent 52%),
    var(--color-bg);
}

.page-header {
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
}

.back-button {
  display: grid;
  width: 42px;
  height: 42px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 50%;
  place-items: center;
  background: var(--color-surface-lowest);
}

.back-button > svg {
  width: 21px;
  fill: none;
  stroke: var(--color-primary-container);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.mini-brand {
  display: grid;
  width: 48px;
  height: 48px;
  margin: auto;
  border-radius: 12px;
  place-items: center;
  background: var(--color-primary-container);
}

.mini-brand svg {
  width: 36px;
}

.mini-brand path {
  fill: none;
  stroke: var(--color-accent-pale);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 8;
}

.mini-brand circle {
  fill: var(--color-accent);
}

.intro {
  margin: 38px 12px 30px;
}

.intro p {
  color: var(--color-accent);
  font-size: 14px;
  font-weight: 700;
}

.intro h1 {
  margin-top: 6px;
  color: var(--color-primary-container);
  font-size: 27px;
  letter-spacing: -1.2px;
}

.intro span {
  display: block;
  margin-top: 10px;
  color: var(--color-text-subtle);
  font-size: 13px;
}

.signup-card {
  padding: 28px 30px 30px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: var(--shadow-md);
}

.field-group + .field-group {
  margin-top: 18px;
}

label {
  color: var(--color-on-surface-variant);
  font-size: 13px;
}

.input-wrap {
  display: flex;
  height: 52px;
  margin-top: 8px;
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
  width: 20px;
  margin: 0 14px;
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
  padding-right: 10px;
  border: 0;
  outline: 0;
  color: var(--color-primary-container);
  background: transparent;
  font-size: 15px;
}

.input-wrap input::placeholder {
  color: var(--color-text-muted);
}

.form-message {
  min-height: 18px;
  margin-top: 14px;
  color: var(--color-error);
  font-size: 12px;
}

.signup-button {
  display: flex;
  width: 100%;
  height: 56px;
  margin-top: 27px;
  border: 0;
  border-radius: 2px;
  align-items: center;
  justify-content: center;
  color: var(--color-on-primary);
  background: var(--color-primary-container);
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background var(--transition);
}

.signup-button:hover:not(:disabled) {
  background: var(--color-primary-gradient);
}

.signup-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.spinner {
  width: 21px;
  height: 21px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--color-on-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.login-link {
  margin-top: 28px;
  color: var(--color-on-surface-variant);
  text-align: center;
  font-size: 13px;
}

.login-link a {
  margin-left: 4px;
  color: var(--color-primary-container);
  font-weight: 700;
  text-decoration: none;
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
  .signup-page {
    padding-inline: 14px;
  }

  .signup-card {
    padding-inline: 22px;
  }

  .intro h1 {
    font-size: 24px;
  }
}
</style>
