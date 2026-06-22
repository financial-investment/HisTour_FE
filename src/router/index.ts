import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const PUBLIC_PATHS = ['/login', '/register']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    /* ── 인증 불필요 ─────────────────────────────── */
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

    /* ── AppLayout (바텀 내비 있음) ──────────────── */
    {
      path: '/',
      component: () => import('@/components/layouts/AppLayout.vue'),
      children: [
        {
          path: '',
          component: () => import('@/pages/main/MainPage.vue'),
        },
        {
          path: 'mypage',
          component: () => import('@/pages/mypage/MyPage.vue'),
        },
        {
          path: 'trip',
          component: () => import('@/pages/trip/TripPage.vue'),
        },
      ],
    },

    /* ── 풀스크린 (바텀 내비 없음) ───────────────── */
    {
      path: '/heritage/:heritageId',
      component: () => import('@/pages/heritage/HeritageDetailPage.vue'),
    },
    {
      path: '/quiz/:tripId',
      component: () => import('@/pages/quiz/QuizPage.vue'),
    },
    {
      path: '/report/:tripId',
      component: () => import('@/pages/report/ReportPage.vue'),
    },

    /* ── 404 ─────────────────────────────────────── */
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const isPublic = PUBLIC_PATHS.includes(to.path) || to.meta?.public === true

  if (!isPublic && !userStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (isPublic && userStore.isLoggedIn) {
    return { path: '/' }
  }
})

export default router
