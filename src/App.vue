<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import AdminLayout from '@/components/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 判断是否为管理后台路由
const isAdmin = computed(() => route.meta?.requiresAuth)
// 特殊布局（如登录页、设置页）
const isSpecialLayout = computed(() => route.meta?.layout === 'none')

onMounted(async () => {
  if (isAdmin.value) {
    await authStore.checkAuth()
    if (!authStore.isLoggedIn) {
      // 检查是否需要初始化
      try {
        const res = await api.get('/api/setup/status')
        if (!res.data.initialized) {
          router.replace('/setup')
          return
        }
      } catch {
        // 忽略错误
      }
    }
  }
})
</script>

<template>
  <!-- 登录页、设置页等特殊布局 - 无侧边栏 -->
  <router-view v-if="isSpecialLayout" />

  <!-- 管理后台布局 - 带侧边栏 -->
  <AdminLayout v-else-if="isAdmin">
    <router-view />
  </AdminLayout>

  <!-- 公共页面布局 - 无侧边栏 -->
  <router-view v-else />
</template>