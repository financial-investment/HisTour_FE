import axios from 'axios'
import type { ApiResponse, TokenResponse } from '@/types/api'

const ACCESS_TOKEN_KEY = 'histour_access_token'
const REFRESH_TOKEN_KEY = 'histour_refresh_token'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 요청마다 access token 주입
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let waitQueue: Array<(token: string) => void> = []

function drainQueue(newToken: string) {
  waitQueue.forEach((resolve) => resolve(newToken))
  waitQueue = []
}

// 401 → refresh → retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefresh()
    if (!refreshToken) {
      tokenStorage.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        waitQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<ApiResponse<TokenResponse>>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/refresh`,
        { refreshToken },
      )
      const { accessToken, refreshToken: newRefresh } = data.data
      tokenStorage.set(accessToken, newRefresh)
      drainQueue(accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(original)
    } catch {
      tokenStorage.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
