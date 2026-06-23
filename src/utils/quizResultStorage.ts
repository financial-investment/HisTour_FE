import type { QuizResultResponse } from '@/types/api'

const STORAGE_PREFIX = 'histour.quizResult.'

function getStorageKey(tripId: number) {
  return `${STORAGE_PREFIX}${tripId}`
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function saveQuizResult(result: QuizResultResponse) {
  if (!canUseStorage()) return
  window.localStorage.setItem(getStorageKey(result.tripId), JSON.stringify(result))
}

export function loadQuizResult(tripId: number) {
  if (!canUseStorage()) return null

  const raw = window.localStorage.getItem(getStorageKey(tripId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as QuizResultResponse
  } catch {
    window.localStorage.removeItem(getStorageKey(tripId))
    return null
  }
}
