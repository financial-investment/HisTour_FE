<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { heritageApi } from '@/api/heritageApi'
import { getCurrentCoordinates } from '@/composables/useGeolocation'
import { useJourneyStore } from '@/stores/journeyStore'
import { extractGpsFromFile, fileToBase64 } from '@/utils/imageUtils'
import ScanChoiceSection from './components/ScanChoiceSection.vue'

const route = useRoute()
const router = useRouter()
const journeyStore = useJourneyStore()

const video = ref<HTMLVideoElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const uploadInput = ref<HTMLInputElement | null>(null)
const scanMode = ref<'choice' | 'camera'>('choice')
const cameraReady = ref(false)
const isProcessing = ref(false)
const errorMessage = ref('')
const focusPoint = ref<{ x: number; y: number } | null>(null)
let stream: MediaStream | null = null

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    if (video.value) {
      video.value.srcObject = stream
      await video.value.play()
      cameraReady.value = true
    }
  } catch {
    errorMessage.value = '카메라를 사용할 수 없어요. 보관함에서 사진을 선택해 주세요.'
  }
}

async function chooseCamera() {
  scanMode.value = 'camera'
  errorMessage.value = ''
  await startCamera()
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
}

async function capturePhoto() {
  if (!video.value || !cameraReady.value) {
    cameraInput.value?.click()
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = video.value.videoWidth
  canvas.height = video.value.videoHeight
  canvas.getContext('2d')?.drawImage(video.value, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (blob) await analyze(new File([blob], 'heritage-capture.jpg', { type: 'image/jpeg' }))
}

async function selectPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await analyze(file)
  input.value = ''
}

function openImageUpload() {
  if (isProcessing.value) return
  uploadInput.value?.click()
}

async function analyze(file: File) {
  if (isProcessing.value) return
  isProcessing.value = true
  errorMessage.value = ''
  try {
    const [image, exifGps] = await Promise.all([fileToBase64(file), extractGpsFromFile(file)])
    const position = exifGps ?? (await getCurrentCoordinates())
    const tripId = Number(route.params.tripId)
    const result = await heritageApi.explain({ image, lat: position.lat, lng: position.lng, tripId })
    const previewUrl = URL.createObjectURL(file)
    journeyStore.setExplanation(result, previewUrl, tripId)
    stopCamera()
    await router.push('/heritage/explanation')
  } catch {
    errorMessage.value = '사진에서 문화재를 찾지 못했어요. 건물 전체가 보이도록 다시 촬영해 주세요.'
  } finally {
    isProcessing.value = false
  }
}

function setFocus(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  focusPoint.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  window.setTimeout(() => (focusPoint.value = null), 800)
}

async function closeScan() {
  stopCamera()
  if (window.history.state.back) {
    router.back()
    return
  }
  await router.push('/trip')
}

onBeforeUnmount(stopCamera)
</script>

<template>
  <main class="scan-page" @pointerdown="setFocus">
    <div class="camera-feed">
      <video ref="video" muted autoplay playsinline />
      <div v-if="!cameraReady" class="camera-fallback">
        <span>🏛</span>
        <p>카메라를 준비하고 있어요</p>
      </div>
      <div class="camera-shade" />
    </div>

    <header>
      <button type="button" aria-label="닫기" @click="closeScan">×</button>
      <div>
        <i />
        <span>{{ scanMode === 'camera' ? 'LIVE VISION' : 'HERITAGE SCAN' }}</span>
      </div>
      <button v-if="scanMode === 'camera'" type="button" aria-label="이미지 업로드" @click="openImageUpload">▧</button>
      <span v-else class="header-spacer" />
    </header>

    <section v-if="scanMode === 'camera'" class="viewfinder" aria-label="문화재 촬영 영역">
      <i class="corner top-left" /><i class="corner top-right" />
      <i class="corner bottom-left" /><i class="corner bottom-right" />
      <span class="scan-line" />
      <div class="status">
        <span class="status-spinner" />AI가 이 장소를 파악할 준비가 됐어요
      </div>
    </section>

    <span
      v-if="focusPoint"
      class="focus-indicator"
      :style="{ left: `${focusPoint.x}px`, top: `${focusPoint.y}px` }"
    />

    <p v-if="errorMessage && scanMode === 'camera'" class="scan-error" role="alert">
      {{ errorMessage }}
    </p>

    <footer v-if="scanMode === 'camera'">
      <button class="side-control" type="button" :disabled="isProcessing" @click="openImageUpload">
        <span>▧</span>이미지 업로드
      </button>
      <button class="shutter" type="button" aria-label="사진 촬영" :disabled="isProcessing" @click="capturePhoto">
        <i />
      </button>
      <button class="side-control" type="button" @click="router.push('/trip')">
        <span>⌛</span>기록
      </button>
    </footer>

    <ScanChoiceSection v-else @choose-camera="chooseCamera" @choose-upload="openImageUpload">
      <template v-if="errorMessage" #error>
        <p class="choice-error" role="alert">{{ errorMessage }}</p>
      </template>
    </ScanChoiceSection>

    <input
      ref="cameraInput"
      class="hidden-input"
      type="file"
      accept="image/*"
      capture="environment"
      @change="selectPhoto"
    />
    <input
      ref="uploadInput"
      class="hidden-input"
      type="file"
      accept="image/*,.heic,.heif"
      aria-label="문화재 이미지 업로드"
      @change="selectPhoto"
    />

    <div v-if="isProcessing" class="processing-overlay" aria-live="assertive">
      <span class="status-spinner large" />
      <strong>문화재를 식별하고 있어요</strong>
      <p>위치와 사진을 함께 분석 중입니다.</p>
    </div>
  </main>
</template>

<style scoped>
.scan-page {
  position: fixed;
  z-index: 1000;
  inset: 0;
  max-width: var(--mobile-max-width);
  margin: auto;
  overflow: hidden;
  color: white;
  background: #0a0d12;
  touch-action: manipulation;
}

.camera-feed,
.camera-feed video,
.camera-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.camera-feed video {
  object-fit: cover;
}

.camera-shade {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 25%, transparent 70%, rgba(0, 0, 0, 0.65));
}

.camera-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 10px;
  text-align: center;
  background: radial-gradient(circle at 50% 45%, #60533c, #1a1d21 65%);
}

.camera-fallback span {
  font-size: 64px;
  filter: grayscale(0.4);
}

.camera-fallback p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

header {
  position: absolute;
  z-index: 5;
  top: 0;
  left: 0;
  right: 0;
  padding: max(18px, env(safe-area-inset-top)) 17px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

header button,
header > div {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

header button {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  color: white;
  font-size: 25px;
}

header > div {
  padding: 9px 13px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

header i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffd4b2;
  animation: pulse 1.4s infinite;
}

header span {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.header-spacer {
  width: 46px;
  height: 46px;
}

.viewfinder {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  width: min(76vw, 330px);
  height: min(76vw, 330px);
  transform: translate(-50%, -55%);
}

.corner {
  position: absolute;
  width: 38px;
  height: 38px;
  border-color: white;
}

.top-left {
  top: 0;
  left: 0;
  border-top: 2px solid;
  border-left: 2px solid;
}

.top-right {
  top: 0;
  right: 0;
  border-top: 2px solid;
  border-right: 2px solid;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid;
  border-left: 2px solid;
}

.bottom-right {
  right: 0;
  bottom: 0;
  border-right: 2px solid;
  border-bottom: 2px solid;
}

.scan-line {
  position: absolute;
  left: 25px;
  right: 25px;
  top: 25px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ffdcc3, transparent);
  animation: scan 2.5s ease-in-out infinite;
}

.status {
  position: absolute;
  top: calc(100% + 34px);
  left: 50%;
  width: max-content;
  max-width: 300px;
  padding: 11px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 9px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  font-size: 11px;
}

.status-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.status-spinner.large {
  width: 38px;
  height: 38px;
  border-width: 3px;
}

.focus-indicator {
  position: absolute;
  z-index: 4;
  width: 58px;
  height: 58px;
  border: 1px solid #ffdcc3;
  transform: translate(-50%, -50%);
  animation: focus 0.8s ease-out both;
  pointer-events: none;
}

.scan-error {
  position: absolute;
  z-index: 3;
  left: 22px;
  right: 22px;
  bottom: 155px;
  padding: 11px 14px;
  border-radius: 8px;
  text-align: center;
  background: rgba(144, 16, 25, 0.8);
  backdrop-filter: blur(8px);
  font-size: 11px;
  line-height: 1.45;
}

footer {
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  bottom: max(26px, env(safe-area-inset-bottom));
  padding: 0 33px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.side-control {
  max-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 9px;
  line-height: 1.2;
}

.side-control > span {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: white;
  font-size: 22px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.side-control:disabled {
  opacity: 0.5;
}

.shutter {
  width: 82px;
  height: 82px;
  border: 4px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: transparent;
}

.shutter i {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
}

.shutter:active {
  transform: scale(0.92);
}

.shutter:disabled {
  opacity: 0.5;
}

.choice-error {
  margin-top: 16px;
  padding: 9px 12px;
  border-radius: 7px;
  background: rgba(144, 16, 25, 0.75);
  font-size: 10px;
  color: white;
}

.hidden-input {
  display: none;
}

.processing-overlay {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 13px;
  background: rgba(3, 22, 50, 0.78);
  backdrop-filter: blur(8px);
}

.processing-overlay strong {
  font-family: var(--font-serif);
  font-size: 20px;
}

.processing-overlay p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes scan {
  0%,
  100% {
    opacity: 0.2;
    transform: translateY(0);
  }
  50% {
    opacity: 0.9;
    transform: translateY(275px);
  }
}

@keyframes focus {
  0% {
    opacity: 0;
    scale: 1.5;
  }
  25% {
    opacity: 1;
    scale: 1;
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    scale: 0.9;
  }
}
</style>
