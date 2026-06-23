import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/layouts/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
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
    {
      path: '/heritage/explanation',
      component: () => import('@/pages/heritage/HeritageExplanationPage.vue'),
    },
    {
      path: '/trip/:tripId/scan',
      component: () => import('@/pages/heritage/HeritageScanPage.vue'),
    },
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
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  await userStore.init()

  const isPublic = to.meta.public === true
  if (!isPublic && !userStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (isPublic && userStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
