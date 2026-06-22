import apiClient from './apiClient'
import type { ApiResponse, ReportResponse } from '@/types/api'

export const reportApi = {
  get(tripId: number) {
    return apiClient
      .get<ApiResponse<ReportResponse>>(`/api/report/${tripId}`)
      .then((r) => r.data.data)
  },
}
