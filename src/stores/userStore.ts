import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tokenStorage } from '@/api/apiClient'
import apiClient from '@/api/apiClient'
import type { ApiResponse, UserResponse, TokenResponse } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserResponse | null>(null)
  const isInitialized = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const { data } = await apiClient.post<ApiResponse<TokenResponse>>('/api/auth/login', {
      email,
      password,
    })
    tokenStorage.set(data.data.accessToken, data.data.refreshToken)
    await fetchMe()
  }

  async function fetchMe() {
    try {
      const { data } = await apiClient.get<ApiResponse<UserResponse>>('/api/user/me')
      user.value = data.data
    } catch {
      user.value = null
    }
  }

  async function logout() {
    try {
      const refreshToken = tokenStorage.getRefresh()
      if (refreshToken) {
        await apiClient.post('/api/auth/logout', { refreshToken })
      }
    } catch {
      // 서버 오류여도 로컬은 클리어
    } finally {
      tokenStorage.clear()
      user.value = null
    }
  }

  async function init() {
    if (isInitialized.value) return
    isInitialized.value = true
    if (tokenStorage.getAccess()) {
      await fetchMe()
    }
  }

  return { user, isLoggedIn, isInitialized, login, logout, fetchMe, init }
})
