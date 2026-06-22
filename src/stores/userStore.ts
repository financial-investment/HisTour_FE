import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as requestLogin, logout as requestLogout } from '@/api/auth'
import { tokenStorage } from '@/api/apiClient'
import { getMyProfile } from '@/api/user'
import type { UserResponse } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserResponse | null>(null)
  const accessToken = ref(tokenStorage.getAccess())
  const isInitialized = ref(false)
  const isAuthenticated = computed(() => Boolean(accessToken.value))
  const isLoggedIn = isAuthenticated

  async function login(email: string, password: string) {
    const tokens = await requestLogin(email, password)
    tokenStorage.set(tokens.accessToken, tokens.refreshToken)
    accessToken.value = tokens.accessToken
    await loadProfile()
  }

  async function loadProfile() {
    user.value = await getMyProfile()
    return user.value
  }

  async function logout() {
    try {
      await requestLogout()
    } finally {
      clearSession()
    }
  }

  function clearSession() {
    tokenStorage.clear()
    accessToken.value = null
    user.value = null
  }

  async function init() {
    if (isInitialized.value) return
    isInitialized.value = true
    if (!accessToken.value) return

    try {
      await loadProfile()
      accessToken.value = tokenStorage.getAccess()
    } catch {
      clearSession()
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoggedIn,
    isInitialized,
    login,
    loadProfile,
    logout,
    clearSession,
    init,
  }
})
