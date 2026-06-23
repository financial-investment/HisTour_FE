import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ExplainResponse } from '@/types/api'

export const useJourneyStore = defineStore('journey', () => {
  const explanation = ref<ExplainResponse | null>(null)
  const previewUrl = ref<string | null>(null)
  const tripId = ref<number | null>(null)

  function setExplanation(result: ExplainResponse, imageUrl: string, currentTripId: number) {
    explanation.value = result
    previewUrl.value = imageUrl
    tripId.value = currentTripId
  }

  function clear() {
    explanation.value = null
    previewUrl.value = null
    tripId.value = null
  }

  return { explanation, previewUrl, tripId, setExplanation, clear }
})
