import { ref } from 'vue'
import { heritageApi } from '@/api/heritageApi'

export function useHeritageThumbnails() {
  const thumbnails = ref<Record<number, string | null>>({})
  const pendingIds = new Set<number>()

  async function loadThumbnails(heritageIds: number[]) {
    const ids = [...new Set(heritageIds)].filter(
      (id) => Number.isFinite(id) && !(id in thumbnails.value) && !pendingIds.has(id),
    )
    if (ids.length === 0) return

    ids.forEach((id) => pendingIds.add(id))
    await Promise.all(
      ids.map(async (id) => {
        try {
          const detail = await heritageApi.getDetail(id)
          thumbnails.value[id] = detail.thumbnailUrl ?? null
        } catch {
          thumbnails.value[id] = null
        } finally {
          pendingIds.delete(id)
        }
      }),
    )
  }

  function getThumbnail(heritageId: number) {
    return thumbnails.value[heritageId] ?? null
  }

  return { thumbnails, loadThumbnails, getThumbnail }
}
