<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePodcastStore } from '@/stores/podcast'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const podcastStore = usePodcastStore()
const authStore = useAuthStore()

const title = computed(() => route.meta?.title || '播客管理后台')

const activeIndex = computed(() => route.path)

const menuItems = [
  { path: '/admin/dashboard', label: '仪表盘', icon: 'Odometer' },
  { path: '/admin/settings', label: '播客设置', icon: 'Setting' },
  { path: '/admin/episodes', label: '节目管理', icon: 'List' },
  { path: '/admin/system', label: '系统配置', icon: 'Tools' },
]

function navigate(path) {
  router.push(path)
}

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="app-container">
    <div class="app-sidebar">
      <div class="sidebar-header">
        <h2>播客管理</h2>
        <p>{{ podcastStore.settings.title || 'Apple Podcasts' }}</p>
      </div>
      <el-menu
        :default-active="activeIndex"
        @select="navigate"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <!-- 底部用户信息 -->
      <div class="sidebar-footer">
        <div class="user-info" v-if="authStore.user">
          <el-avatar :size="28">
            {{ authStore.user.name?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="user-name">{{ authStore.user.name }}</span>
        </div>
        <el-button text size="small" @click="handleLogout" style="color:#909399">
          <el-icon><SwitchButton /></el-icon> 退出
        </el-button>
      </div>
    </div>
    <div class="app-main">
      <div class="app-header">
        <h3>{{ title }}</h3>
        <div class="header-right">
          <el-button text @click="router.push('/')">
            <el-icon><View /></el-icon> 查看前台
          </el-button>
        </div>
      </div>
      <div class="app-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
}
.app-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}
.sidebar-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}
.sidebar-header p {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0;
}
.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-name {
  font-size: 13px;
  color: #606266;
}
.app-sidebar .el-menu {
  border-right: none;
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-header h3 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}
.app-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
