import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || ''

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 未授权 - 重定向到登录页
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      if (authStore) {
        authStore.user = null
      }
      // 不在登录页时跳转
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
    }
    console.error('API Error:', error.response || error.message)
    return Promise.reject(error)
  }
)

// 动态导入 auth store 避免循环依赖
import { useAuthStore } from '@/stores/auth'
