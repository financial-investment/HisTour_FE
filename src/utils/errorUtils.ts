/**
 * axios 에러에서 서버 메시지를 추출하고, 없으면 fallback 반환
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response
    return res?.data?.message || fallback
  }
  return fallback
}

/**
 * axios 에러에서 HTTP 상태 코드를 추출
 */
export function getResponseStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = error as { response?: { status?: number } }
    return res.response?.status
  }
  return undefined
}
