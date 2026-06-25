export async function extractGpsFromFile(
  file: File,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const { parse } = await import('exifr')
    const gps = await parse(file, { gps: true })
    if (gps?.latitude != null && gps?.longitude != null) {
      return { lat: gps.latitude, lng: gps.longitude }
    }
  } catch {
    // EXIF 없거나 파싱 실패 → 폴백
  }
  return null
}

export async function fileToBase64(file: File): Promise<string> {
  const converted = await convertIfHeic(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = reject
    reader.readAsDataURL(converted)
  })
}

async function convertIfHeic(file: File): Promise<File | Blob> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')

  if (!isHeic) return file

  const { default: heic2any } = await import('heic2any')
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 })
  const blob = Array.isArray(result) ? result[0] : result
  if (!blob) throw new Error('HEIC 변환 실패')
  return blob
}
