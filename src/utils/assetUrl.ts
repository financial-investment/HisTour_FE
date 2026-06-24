export function normalizeAssetUrl(url: string | null | undefined): string {
  if (!url) return ''

  const shouldUseDevProxy = !import.meta.env.VITE_API_BASE_URL
  if (!shouldUseDevProxy) return url

  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.pathname.startsWith('/photos/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    return url
  }

  return url
}

export function applyFallbackAsset(event: Event, fallbackUrl: string | null | undefined) {
  const img = event.target
  if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return

  const nextUrl = normalizeAssetUrl(fallbackUrl)
  if (!nextUrl || img.src === nextUrl) return

  img.dataset.fallbackApplied = 'true'
  img.src = nextUrl
}
