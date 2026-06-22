import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
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

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<TokenResponse> | null = null

function refreshTokens(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<TokenResponse>>(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/refresh`,
        { refreshToken },
      )
      .then(({ data }) => {
        tokenStorage.set(data.data.accessToken, data.data.refreshToken)
        return data.data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefresh()
    if (!refreshToken) {
      tokenStorage.clear()
      window.location.assign('/login')
      return Promise.reject(error)
    }

    original._retry = true
    try {
      const tokens = await refreshTokens(refreshToken)
      original.headers.Authorization = `Bearer ${tokens.accessToken}`
      return apiClient(original)
    } catch (refreshError) {
      tokenStorage.clear()
      window.location.assign('/login')
      return Promise.reject(refreshError)
    }
  },
)

export default apiClient
