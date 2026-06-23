<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { heritageApi } from '@/api/heritageApi'
import { useJourneyStore } from '@/stores/journeyStore'

const router = useRouter()
const journeyStore = useJourneyStore()
const selectedTopic = ref('숨겨진 이야기')
const deepExplanation = ref('')
const isLoadingDeep = ref(false)
const errorMessage = ref('')
const result = computed(() => journeyStore.explanation)
const topics = [
  { icon: '✦', label: '숨겨진 이야기', description: '잘 알려지지 않은 비화' },
  { icon: '♙', label: '역사적 인물', description: '이곳을 거쳐간 사람들' },
  { icon: '⌂', label: '건축과 상징', description: '공간에 담긴 의미' },
  { icon: '⌛', label: '시대적 맥락', description: '당시 사회와 사건' },
]

async function requestDeepExplanation() {
  if (!result.value?.visitLogId || isLoadingDeep.value) return
  isLoadingDeep.value = true
  errorMessage.value = ''
  try {
    const response = await heritageApi.explainDeeper(
      result.value.heritageId,
      result.value.visitLogId,
      selectedTopic.value,
    )
    deepExplanation.value = response.explanation
  } catch {
    errorMessage.value = '심화 해설을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoadingDeep.value = false
  }
}

function returnToTrip() {
  const tripId = journeyStore.tripId
  journeyStore.clear()
  router.replace(tripId ? '/trip' : '/')
}
</script>

<template>
  <main v-if="result" class="explanation-page">
    <header>
      <button type="button" aria-label="여행으로 돌아가기" @click="returnToTrip">←</button>
      <strong>HisTour Archive</strong>
      <span>AI</span>
    </header>

    <section class="hero">
      <img v-if="journeyStore.previewUrl" :src="journeyStore.previewUrl" :alt="result.heritageName" />
      <div class="hero-shade" />
      <div class="hero-copy">
        <p>HERITAGE IDENTIFIED</p>
        <h1>{{ result.heritageName }}</h1>
        <span>현장 사진과 위치를 기반으로 찾았습니다</span>
      </div>
    </section>

    <section class="content">
      <article class="explanation-card">
        <div class="card-label"><span>01</span><p>BASIC EXPLANATION</p></div>
        <p class="explanation-text">{{ result.explanation }}</p>
        <footer><i />HISTOUR AI CURATOR<i /></footer>
      </article>

      <section class="deeper-section">
        <p class="section-kicker">GO DEEPER</p>
        <h2>어떤 이야기가 더 궁금한가요?</h2>
        <div class="topic-grid">
          <button
            v-for="topic in topics"
            :key="topic.label"
            type="button"
            :class="{ selected: selectedTopic === topic.label }"
            @click="selectedTopic = topic.label"
          >
            <span>{{ topic.icon }}</span>
            <strong>{{ topic.label }}</strong>
            <small>{{ topic.description }}</small>
          </button>
        </div>
        <button class="deep-button" type="button" :disabled="!result.visitLogId || isLoadingDeep" @click="requestDeepExplanation">
          {{ isLoadingDeep ? '이야기를 찾는 중...' : '선택한 심화 해설 보기' }}
        </button>
        <p v-if="!result.visitLogId" class="hint">여행 중 스캔한 문화재만 심화 해설을 볼 수 있어요.</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      </section>

      <article v-if="deepExplanation" class="deep-result">
        <span>{{ selectedTopic }}</span>
        <h2>기록 너머의 이야기</h2>
        <p>{{ deepExplanation }}</p>
      </article>

      <button class="return-button" type="button" @click="returnToTrip">여행 지도로 돌아가기</button>
    </section>
  </main>

  <main v-else class="missing-result">
    <span>⌕</span><h1>해설 기록이 없어요</h1><p>여행 지도에서 문화재를 먼저 스캔해 주세요.</p>
    <RouterLink to="/trip">여행으로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.explanation-page { min-height: 100dvh; color: #17243a; background: #f8f9ff; }.explanation-page > header { height: 58px; padding: 0 17px; display: grid; grid-template-columns: 34px 1fr 34px; align-items: center; background: white; border-bottom: 1px solid #dce2eb; }.explanation-page header button { font-size: 20px; }.explanation-page header strong { font-family: var(--font-serif); font-size: 15px; }.explanation-page header > span { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; justify-self: end; color: white; background: #17345c; font-size: 9px; }
.hero { position: relative; height: 340px; overflow: hidden; background: #263247; }.hero img { width: 100%; height: 100%; object-fit: cover; }.hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg,transparent 28%,rgba(3,22,50,.88)); }.hero-copy { position: absolute; left: 24px; right: 24px; bottom: 28px; color: white; }.hero-copy p,.section-kicker { color: #ffb77d; font-size: 9px; font-weight: 700; letter-spacing: .16em; }.hero-copy h1 { margin-top: 7px; font-family: var(--font-serif); font-size: 31px; }.hero-copy span { display: block; margin-top: 6px; color: rgba(255,255,255,.7); font-size: 10px; }
.content { padding: 24px 18px 40px; }.explanation-card { position: relative; padding: 25px 21px 20px; border: 1px solid #d6dde7; background: white; box-shadow: 0 8px 25px rgba(26,43,72,.07); }.explanation-card::before,.explanation-card::after { position: absolute; width: 20px; height: 20px; content:""; }.explanation-card::before { top: 8px; left: 8px; border-top: 1px solid #c4813d; border-left: 1px solid #c4813d; }.explanation-card::after { right: 8px; bottom: 8px; border-right: 1px solid #c4813d; border-bottom: 1px solid #c4813d; }.card-label { display: flex; align-items: center; gap: 9px; }.card-label span { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: white; background: #17345c; font-size: 9px; }.card-label p { color: #8b6470; font-size: 8px; font-weight: 700; letter-spacing: .12em; }.explanation-text,.deep-result p { margin-top: 19px; white-space: pre-line; color: #3f4b5c; font-family: var(--font-serif); font-size: 15px; line-height: 1.9; }.explanation-card footer { margin-top: 22px; display: flex; align-items: center; gap: 8px; color: #a2a8b0; font-size: 7px; letter-spacing: .1em; }.explanation-card footer i { height: 1px; flex: 1; background: #e3e6eb; }
.deeper-section { margin-top: 35px; }.deeper-section h2 { margin-top: 5px; font-family: var(--font-serif); font-size: 22px; }.topic-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }.topic-grid button { min-height: 116px; padding: 15px; border: 1px solid #d8dee7; display: flex; flex-direction: column; align-items: flex-start; text-align: left; background: white; }.topic-grid button.selected { border-color: #17345c; box-shadow: inset 0 0 0 1px #17345c; background: #f2f6fc; }.topic-grid button > span { font-size: 23px; }.topic-grid strong { margin-top: 9px; font-family: var(--font-serif); font-size: 13px; }.topic-grid small { margin-top: 3px; color: #89929e; font-size: 9px; }.deep-button,.return-button { width: 100%; min-height: 52px; margin-top: 16px; color: white; background: #17345c; font-weight: 700; }.deep-button:disabled { opacity: .5; }.hint,.error { margin-top: 9px; text-align: center; color: #8a929d; font-size: 10px; }.error { color: #ba1a1a; }.deep-result { margin-top: 25px; padding: 24px 20px; border-left: 3px solid #c46c18; background: #fff7ed; }.deep-result > span { color: #c46c18; font-size: 9px; font-weight: 700; letter-spacing: .12em; }.deep-result h2 { margin-top: 5px; font-family: var(--font-serif); font-size: 21px; }.return-button { margin-top: 28px; background: #667386; }
.missing-result { min-height: 100dvh; padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: #f8f9ff; }.missing-result > span { font-size: 55px; }.missing-result h1 { margin-top: 15px; font-family: var(--font-serif); }.missing-result p { margin-top: 8px; color: #7b8490; font-size: 12px; }.missing-result a { margin-top: 24px; padding: 14px 25px; color: white; background: #17345c; font-size: 12px; }
</style>
