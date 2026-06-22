import apiClient from './apiClient'
import { tokenStorage } from './apiClient'
import type { ApiResponse, TokenResponse } from '@/types/api'

export async function login(email: string, password: string) {
  const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/auth/login', {
    email,
    password,
  })

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '로그인에 실패했습니다.')
  }

  return response.data.data
}

export interface SignUpRequest {
  nickname: string
  email: string
  password: string
  preferredLang: string
}

export async function signUp(request: SignUpRequest) {
  const response = await apiClient.post<ApiResponse<null>>('/api/user', request)

  if (!response.data.success) {
    throw new Error(response.data.message || '회원가입에 실패했습니다.')
  }
}

export async function logout() {
  const refreshToken = tokenStorage.getRefresh()
  await apiClient.post('/api/auth/logout', refreshToken ? { refreshToken } : undefined)
}
