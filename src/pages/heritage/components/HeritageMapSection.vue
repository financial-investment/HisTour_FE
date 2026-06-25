<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { loadKakaoMaps } from '@/utils/kakaoMaps'

const props = defineProps<{
  lat: number
  lng: number
  name: string
}>()

const mapElement = ref<HTMLElement | null>(null)
const mapError = ref(false)
let mapObject: { setMap?: (m: null) => void } | null = null

onMounted(async () => {
  if (!mapElement.value) return
  try {
    const kakaoMaps = await loadKakaoMaps()
    const position = new kakaoMaps.LatLng(props.lat, props.lng)
    const map = new kakaoMaps.Map(mapElement.value, { center: position, level: 4 })

    const markerEl = document.createElement('div')
    markerEl.className = 'heritage-map-pin'
    markerEl.title = props.name
    const overlay = new kakaoMaps.CustomOverlay({
      position,
      content: markerEl,
      xAnchor: 0.5,
      yAnchor: 1,
    })
    overlay.setMap(map)
    mapObject = overlay
  } catch {
    mapError.value = true
  }
})

onBeforeUnmount(() => {
  mapObject?.setMap?.(null)
  mapObject = null
})
</script>

<template>
  <section class="section">
    <p class="section-label">위치 정보</p>
    <div class="map-wrap">
      <div v-if="!mapError" ref="mapElement" class="map-canvas" aria-label="문화재 위치 지도" />
      <p v-else class="map-error">지도를 불러올 수 없어요.</p>
    </div>
  </section>
</template>

<style scoped>
.section {
  margin-bottom: 28px;
}

.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin: 0 0 10px;
}

.map-wrap {
  border-radius: 14px;
  overflow: hidden;
}

.map-canvas {
  width: 100%;
  height: 200px;
  background: var(--color-surface-high);
}

.map-error {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 12px;
  color: var(--color-outline);
  background: var(--color-surface-high);
}

:global(.heritage-map-pin) {
  width: 28px;
  height: 28px;
  border: 3px solid white;
  border-radius: 50% 50% 50% 4px;
  background: var(--color-primary);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transform: rotate(-45deg);
}
</style>
