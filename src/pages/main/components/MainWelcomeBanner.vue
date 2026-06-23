<script setup lang="ts">
defineProps<{
  nickname?: string
}>()
</script>

<template>
  <section class="welcome" aria-label="인사말">
    <div class="welcome-text">
      <p class="welcome-sub">오늘은 어떤 이야기를 만나볼까요?</p>
      <h1 class="welcome-title">
        <template v-if="nickname">{{ nickname }}님,</template>
        <template v-else>반가워요,</template>
        <br />역사 속으로 떠나봐요.
      </h1>
    </div>
    <div class="welcome-deco" aria-hidden="true">
      <svg class="deco-gate" viewBox="0 0 100 80">
        <path d="M10 70h80M18 62h64M28 56V34h44v22M22 34h56L50 8 22 34Z" />
        <path d="M36 38v16M50 38v16M64 38v16" />
        <circle cx="50" cy="22" r="3" />
      </svg>
      <div class="deco-dots"><span></span><span></span><span></span></div>
    </div>
  </section>
</template>

<style scoped>
.welcome {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 180px;
  padding: 28px 24px 24px;
  border-radius: 20px;
  overflow: hidden;
  color: var(--color-on-primary);
  background: linear-gradient(
    140deg,
    var(--color-primary-container) 0%,
    var(--color-primary-gradient) 100%
  );
  box-shadow: var(--shadow-lg);
}

.welcome::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.06) 0 30%, transparent 60%),
    radial-gradient(circle at 10% 90%, rgba(219, 121, 10, 0.15) 0 25%, transparent 55%);
}

.welcome-text {
  position: relative;
}

.welcome-sub {
  font-size: 11px;
  color: var(--color-on-primary-soft);
  letter-spacing: 0.02em;
}

.welcome-title {
  margin-top: 10px;
  font-size: 23px;
  line-height: 1.4;
  letter-spacing: -0.8px;
}

.welcome-deco {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.deco-gate {
  width: 72px;
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.deco-dots {
  display: flex;
  gap: 5px;
}
.deco-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.8;
}
.deco-dots span:nth-child(2) {
  opacity: 0.5;
}
.deco-dots span:nth-child(3) {
  opacity: 0.3;
}
</style>
