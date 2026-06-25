<script setup lang="ts">
defineProps<{
  title: string
  visitCount: number
}>()
</script>

<template>
  <section class="report-hero">
    <div class="hero-meta">
      <span>여행 리포트</span>
      <i></i>
      <small>{{ visitCount }}곳 방문</small>
    </div>
    <h1>{{ title }}</h1>
    <div class="hero-bars" aria-hidden="true">
      <span></span>
      <span></span>
    </div>
  </section>
</template>

<style scoped>
.report-hero {
  margin-bottom: 48px;
}

.hero-meta {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.hero-meta span {
  padding: 5px 10px;
  color: #fff;
  background: #1a2b48;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-meta i {
  height: 1px;
  background: #c5c6ce;
}

.hero-meta small {
  color: #5c5f60;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-hero h1 {
  color: #031632;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
  line-height: 1.18;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.hero-bars {
  display: flex;
  gap: 8px;
  margin-top: 22px;
}

.hero-bars span:first-child {
  width: 52px;
  height: 4px;
  background: #1a2b48;
}

.hero-bars span:last-child {
  width: 18px;
  height: 4px;
  background: #c5c6ce;
}
</style>
