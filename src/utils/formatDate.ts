/**
 * "2026년 6월 25일" 형식 — 목록/카드에서 날짜를 읽기 좋게 표시할 때
 * @param value ISO 날짜 문자열 (예: "2026-06-25" 또는 "2026-06-25T...")
 * @param fallback 값이 없거나 파싱 실패 시 반환할 문자열
 */
export function formatTripDate(value: string | null | undefined, fallback = '날짜 미정'): string {
  if (!value) return fallback
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

/**
 * "2026.06.25" 형식 — 작은 공간에서 날짜를 compact하게 표시할 때
 * @param value ISO 날짜 문자열 (예: "2026-06-25" 또는 "2026-06-25T...")
 * @param fallback 값이 없을 때 반환할 문자열
 */
export function formatShortDate(value: string | null | undefined, fallback = ''): string {
  if (!value) return fallback
  return value.slice(0, 10).replace(/-/g, '.')
}
