import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
  },

  actions: {
    async checkAuth() {
      this.loading = true
      try {
        const res = await api.get('/api/auth/me')
        this.user = res.data.user || null
      } catch {
        this.user = null
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await api.post('/api/auth/logout')
      } catch {
        // ignore
      }
      this.user = null
      // 重定向到首页
      window.location.href = '/'
    },

    login() {
      // 跳转到飞书登录页面
      const redirect = encodeURIComponent(window.location.pathname)
      window.location.href = `/api/auth/login?redirect=${redirect}`
    },
  },
})
