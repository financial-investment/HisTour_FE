import apiClient from './apiClient'
import type { ApiResponse, HeritageDetailResponse, HeritageCategoryStats, ExplainResponse } from '@/types/api'

export const heritageApi = {
  getCategoryStats() {
    return apiClient
      .get<ApiResponse<HeritageCategoryStats[]>>('/api/heritage/stats/category')
      .then((r) => r.data.data)
  },

  getDetail(heritageId: number) {
    return apiClient
      .get<ApiResponse<HeritageDetailResponse>>(`/api/heritage/${heritageId}`)
      .then((r) => r.data.data)
  },

  explain(payload: { image: string; lat: number; lng: number; tripId?: number | null }) {
    return apiClient
      .post<ApiResponse<ExplainResponse>>('/api/heritage/explain', payload)
      .then((r) => r.data.data)
  },

  explainDeeper(heritageId: number, visitLogId: number, topic?: string | null) {
    const params = topic ? { visitLogId, topic } : { visitLogId }
    return apiClient
      .get<ApiResponse<ExplainResponse>>(`/api/heritage/${heritageId}/explain/deeper`, { params })
      .then((r) => r.data.data)
  },
}
