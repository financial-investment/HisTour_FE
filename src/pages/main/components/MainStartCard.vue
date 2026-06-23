<template>
  <RouterLink to="/trip" class="start-card">
    <div class="start-text">
      <span class="start-badge">새로운 여행</span>
      <h2>내 주변의 역사를<br />발견해 보세요</h2>
      <p>위치 기반으로 가까운 문화유산을 찾아드려요</p>
    </div>
    <svg class="landmark" viewBox="0 0 150 120" aria-hidden="true">
      <path d="M20 97h112M30 88h90M40 82V50h70v32M33 50h84L75 18 33 50Z" />
      <path d="M52 55v25M75 55v25M98 55v25" />
      <circle cx="75" cy="37" r="4" />
    </svg>
  </RouterLink>
</template>

<style scoped>
.start-card {
  position: relative;
  display: block;
  min-height: 164px;
  padding: 24px 22px;
  border: 1px solid var(--color-surface-warm-border);
  border-radius: 18px;
  overflow: hidden;
  background: var(--color-surface-warm);
  text-decoration: none;
  transition: filter var(--transition);
}
.start-card:hover {
  filter: brightness(0.97);
}

.start-text {
  position: relative;
  z-index: 1;
  max-width: 200px;
}

.start-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  background: var(--color-accent);
  color: var(--color-on-primary);
  font-size: 10px;
  font-weight: 700;
}

.start-text h2 {
  margin-top: 10px;
  color: var(--color-primary-container);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.5px;
}
.start-text p {
  margin-top: 8px;
  color: var(--color-on-surface-variant);
  font-size: 11px;
  line-height: 1.5;
}

.landmark {
  position: absolute;
  width: 128px;
  right: -6px;
  bottom: -8px;
  fill: none;
  stroke: var(--color-surface-warm-border);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.5;
  opacity: 0.6;
}
</style>
