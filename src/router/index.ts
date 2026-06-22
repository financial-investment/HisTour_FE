import { createRouter, createWebHistory } from 'vue-router'
import { tripRoutes } from './tripRoutes'
import { quizRoutes } from './quizRoutes'
import { reportRoutes } from './reportRoutes'
import { useUserStore } from '@/stores/userStore'

const PUBLIC_ROUTES = ['/login', '/register']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/pages/main/MainPage.vue'),
    },
    {
      path: '/mypage',
      component: () => import('@/pages/mypage/MyPage.vue'),
    },
    ...tripRoutes,
    ...quizRoutes,
    ...reportRoutes,
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const isPublic = PUBLIC_ROUTES.includes(to.path) || to.meta?.public === true

  if (!isPublic && !userStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (isPublic && userStore.isLoggedIn) {
    return { path: '/' }
  }
})

export default router
