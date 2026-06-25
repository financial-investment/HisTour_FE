<script setup lang="ts">
defineProps<{
  title: string
  tripDate: string
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  submit: []
  'update:title': [value: string]
  'update:tripDate': [value: string]
}>()
</script>

<template>
  <main class="create-trip-page">
    <header class="page-header">
      <RouterLink to="/" aria-label="홈으로 돌아가기">←</RouterLink>
      <strong>HisTour</strong>
      <span class="profile-dot" aria-hidden="true">H</span>
    </header>

    <section class="create-content">
      <div class="calendar-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 9h16M8 13h3M13 13h3M8 16h3" />
        </svg>
      </div>
      <p class="eyebrow">NEW JOURNEY</p>
      <h1>새로운 여행 시작</h1>
      <p class="subtitle">기록하고 싶은 역사의 순간을 설정하세요.</p>

      <form @submit.prevent="emit('submit')">
        <label>
          <span>여행 제목</span>
          <div class="field">
            <input
              :value="title"
              maxlength="40"
              placeholder="예: 서울 고궁 산책"
              @input="emit('update:title', ($event.target as HTMLInputElement).value)"
            />
            <svg viewBox="0 0 24 24">
              <path d="M5 5h10l4 4v10H5zM14 5v5h5M8 14h8M8 17h5" />
            </svg>
          </div>
        </label>
        <label>
          <span>날짜</span>
          <div class="field">
            <input
              :value="tripDate"
              type="date"
              @input="emit('update:tripDate', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </label>

        <aside class="guide-box">
          <span>i</span>
          <p>
            여행이 시작되면 현재 위치를 기반으로 주변의 역사적 장소를 자동으로 탐색하고 기록을
            보관합니다.
          </p>
        </aside>

        <button class="primary-button" type="submit" :disabled="isSubmitting">
          <span aria-hidden="true">▶</span>{{ isSubmitting ? '여행 준비 중...' : 'Start Trip' }}
        </button>
      </form>
      <p class="archive-code">ARCHIVE SERIAL NO: {{ new Date().getFullYear() }}-HT-004</p>
    </section>
  </main>
</template>

<style scoped>
.create-trip-page {
  min-height: calc(100dvh - 60px);
  background: #f8f9ff;
  color: #14233a;
}

.page-header {
  height: 62px;
  padding: 0 18px;
  border-bottom: 1px solid #d8dfeb;
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  background: #fff;
}
.page-header a {
  font-size: 21px;
}
.page-header strong {
  font-family: var(--font-serif);
  font-size: 18px;
}

.profile-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  justify-self: end;
  color: white;
  background: #1b3152;
  font-size: 11px;
}

.create-content {
  padding: 32px 28px 24px;
  text-align: center;
}

.calendar-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 17px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #17345c;
  background: #e8f0fc;
}
.calendar-icon svg {
  width: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
}

.eyebrow {
  color: #c46c18;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
.create-content h1 {
  margin-top: 6px;
  font-family: var(--font-serif);
  font-size: 25px;
}
.subtitle {
  margin-top: 8px;
  color: #747e8c;
  font-size: 12px;
}

form {
  margin-top: 34px;
  text-align: left;
}
label {
  display: block;
  margin-top: 22px;
}
label > span {
  display: block;
  margin-bottom: 9px;
  color: #263a56;
  font-size: 11px;
  font-weight: 700;
}

.field {
  height: 52px;
  padding: 0 13px;
  border: 1px solid #cbd3df;
  display: flex;
  align-items: center;
  background: #fff;
}
.field:focus-within {
  border-color: #1b3152;
  box-shadow: 0 0 0 3px rgba(27, 49, 82, 0.08);
}
.field input {
  min-width: 0;
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  color: #14233a;
  background: transparent;
}
.field input::placeholder {
  color: #a0a8b3;
}
.field svg {
  width: 20px;
  fill: none;
  stroke: #8b95a4;
  stroke-width: 1.5;
}

.guide-box {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #cbd8e9;
  display: flex;
  gap: 10px;
  color: #526074;
  background: #edf3fc;
  font-size: 11px;
  line-height: 1.55;
}
.guide-box > span {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  flex: 0 0 auto;
  text-align: center;
  color: white;
  background: #89a7cf;
}

.primary-button {
  width: 100%;
  min-height: 54px;
  margin-top: 28px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  background: #142b4c;
  font-weight: 700;
}
.primary-button:disabled {
  opacity: 0.55;
}

.archive-code {
  margin-top: 29px;
  color: #a3a8af;
  font-size: 8px;
  letter-spacing: 0.08em;
}
</style>
