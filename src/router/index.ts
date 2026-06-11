import { createRouter, createWebHistory } from 'vue-router'
import { tripRoutes } from './tripRoutes'
import { quizRoutes } from './quizRoutes'
import { reportRoutes } from './reportRoutes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

export default router
