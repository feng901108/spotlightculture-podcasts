import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ===== 公共路由（无需登录） =====
  {
    path: '/',
    name: 'Public',
    component: () => import('@/views/PublicView.vue'),
    meta: { title: '播客', public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true, layout: 'none' },
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('@/views/SetupView.vue'),
    meta: { title: '系统初始化', public: true, layout: 'none' },
  },

  // ===== 管理后台路由（需登录） =====
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '仪表盘', requiresAuth: true },
  },
  {
    path: '/admin/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '播客设置', requiresAuth: true },
  },
  {
    path: '/admin/episodes',
    name: 'Episodes',
    component: () => import('@/views/EpisodesView.vue'),
    meta: { title: '节目列表', requiresAuth: true },
  },
  {
    path: '/admin/episodes/new',
    name: 'EpisodeNew',
    component: () => import('@/views/EpisodeEditView.vue'),
    meta: { title: '新建节目', requiresAuth: true },
  },
  {
    path: '/admin/episodes/:id/edit',
    name: 'EpisodeEdit',
    component: () => import('@/views/EpisodeEditView.vue'),
    meta: { title: '编辑节目', requiresAuth: true },
  },
  {
    path: '/admin/system',
    name: 'SystemConfig',
    component: () => import('@/views/SystemConfigView.vue'),
    meta: { title: '系统配置', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    // 确保已检查登录状态
    if (authStore.loading) {
      await authStore.checkAuth()
    }
    if (!authStore.isLoggedIn) {
      // 未登录，重定向到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router