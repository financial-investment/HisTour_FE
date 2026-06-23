import apiClient from './apiClient'
import type {
  ApiResponse,
  TripResponse,
  TripDetailResponse,
  RecommendedHeritage,
} from '@/types/api'

export const tripApi = {
  list() {
    return apiClient.get<ApiResponse<TripResponse[]>>('/api/trip').then((r) => r.data.data)
  },

  create(payload: { title?: string; tripDate?: string }) {
    return apiClient
      .post<ApiResponse<number>>('/api/trip', payload)
      .then((r) => r.data.data)
  },

  getDetail(tripId: number) {
    return apiClient
      .get<ApiResponse<TripDetailResponse>>(`/api/trip/${tripId}`)
      .then((r) => r.data.data)
  },

  complete(tripId: number) {
    return apiClient
      .patch<ApiResponse<void>>(`/api/trip/${tripId}/complete`)
      .then((r) => r.data.data)
  },

  recommendNext(tripId: number, lat: number, lng: number, radiusKm = 5) {
    return apiClient
      .get<ApiResponse<RecommendedHeritage[]>>(`/api/trip/${tripId}/recommend/next`, {
        params: { lat, lng, radiusKm },
      })
      .then((r) => r.data.data)
  },
}
