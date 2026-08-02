<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginMode = ref('feishu') // 'feishu' | 'admin'

// 管理员登录表单
const adminForm = ref({ username: '', password: '' })
const adminLoading = ref(false)
const passwordVisible = ref(false)

async function handleAdminLogin() {
  if (!adminForm.value.username || !adminForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  adminLoading.value = true
  try {
    const res = await api.post('/api/auth/admin-login', adminForm.value)
    if (res.data.user) {
      authStore.user = res.data.user
      const redirect = route.query.redirect || '/admin/dashboard'
      router.push(redirect)
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '登录失败')
  } finally {
    adminLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-icon">
        <el-icon :size="48"><Headset /></el-icon>
      </div>
      <h2>播客管理后台</h2>

      <!-- 方式切换 -->
      <el-radio-group v-model="loginMode" class="login-mode-switch">
        <el-radio-button value="feishu">
          <el-icon><ChatDotSquare /></el-icon> 飞书登录
        </el-radio-button>
        <el-radio-button value="admin">
          <el-icon><User /></el-icon> 管理员登录
        </el-radio-button>
      </el-radio-group>

      <!-- 飞书登录 -->
      <div v-if="loginMode === 'feishu'" class="login-section">
        <p class="login-desc">使用飞书账号登录以管理播客</p>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          @click="authStore.login()"
        >
          <el-icon style="margin-right:6px"><ChatDotSquare /></el-icon>
          飞书扫码登录
        </el-button>
      </div>

      <!-- 管理员登录 -->
      <div v-if="loginMode === 'admin'" class="login-section">
        <p class="login-desc">使用管理员账号密码登录</p>
        <el-form
          :model="adminForm"
          class="admin-form"
          @submit.prevent="handleAdminLogin"
        >
          <el-form-item>
            <el-input
              v-model="adminForm.username"
              placeholder="管理员用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="adminForm.password"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="密码"
              size="large"
              prefix-icon="Lock"
            >
              <template #suffix>
                <el-icon @click="passwordVisible = !passwordVisible" style="cursor:pointer">
                  <View v-if="passwordVisible" /><Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="adminLoading"
            @click="handleAdminLogin"
          >
            登录
          </el-button>
        </el-form>
      </div>

      <div class="login-footer">
        <router-link to="/">返回前台页面</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.login-icon {
  color: #409eff;
  margin-bottom: 16px;
}
.login-card h2 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 24px;
}
.login-mode-switch {
  margin-bottom: 24px;
}
.login-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px;
}
.login-btn {
  width: 100%;
  font-size: 16px;
  padding: 16px;
}
.admin-form {
  text-align: left;
}
.admin-form .el-form-item {
  margin-bottom: 16px;
}
.login-section {
  margin-bottom: 8px;
}
.login-footer {
  margin-top: 24px;
}
.login-footer a {
  color: #909399;
  font-size: 13px;
  text-decoration: none;
}
.login-footer a:hover {
  color: #409eff;
}
</style>