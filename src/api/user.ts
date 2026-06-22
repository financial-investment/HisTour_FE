import apiClient from './apiClient'
import type { ApiResponse, UserResponse } from '@/types/api'

export async function getMyProfile() {
  const response = await apiClient.get<ApiResponse<UserResponse>>('/api/user/me')

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '사용자 정보를 불러오지 못했습니다.')
  }

  return response.data.data
}
