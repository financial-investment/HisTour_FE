import { readonly, ref } from 'vue'

interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

interface PermissionAwareDeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const heading = ref<number | null>(null)
const isActive = ref(false)
let isListening = false

function handleOrientation(event: DeviceOrientationEvent) {
  const compassEvent = event as CompassOrientationEvent
  const nextHeading =
    typeof compassEvent.webkitCompassHeading === 'number'
      ? compassEvent.webkitCompassHeading
      : event.alpha === null
        ? null
        : (360 - event.alpha + 360) % 360

  if (nextHeading !== null && Number.isFinite(nextHeading)) {
    heading.value = Math.round(nextHeading * 10) / 10
    isActive.value = true
  }
}

function addListeners() {
  if (isListening) return
  window.addEventListener('deviceorientation', handleOrientation, true)
  window.addEventListener('deviceorientationabsolute', handleOrientation, true)
  isListening = true
}

function removeListeners() {
  if (!isListening) return
  window.removeEventListener('deviceorientation', handleOrientation, true)
  window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
  isListening = false
  isActive.value = false
  heading.value = null
}

export function useDeviceHeading() {
  async function requestHeadingPermission() {
    if (typeof DeviceOrientationEvent === 'undefined') {
      throw new Error('이 기기에서는 방향 센서를 사용할 수 없어요.')
    }

    const orientationEvent = DeviceOrientationEvent as unknown as PermissionAwareDeviceOrientationEvent
    if (orientationEvent.requestPermission) {
      const permission = await orientationEvent.requestPermission()
      if (permission !== 'granted') throw new Error('동작 및 방향 접근 권한이 필요해요.')
    }

    addListeners()
  }

  return {
    heading: readonly(heading),
    isActive: readonly(isActive),
    requestHeadingPermission,
    stopHeading: removeListeners,
  }
}
