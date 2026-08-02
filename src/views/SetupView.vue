<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const step = ref(0)
const loading = ref(false)

const steps = [
  { title: '欢迎', icon: 'MagicStick' },
  { title: '管理员账号', icon: 'User' },
  { title: '飞书配置（可选）', icon: 'ChatDotSquare' },
  { title: 'COS 存储配置（可选）', icon: 'Cloudy' },
  { title: '完成', icon: 'Select' },
]

const currentStep = computed(() => steps[step.value])

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  feishu: {
    appId: '',
    appSecret: '',
    redirectUri: '',
  },
  cos: {
    secretId: '',
    secretKey: '',
    bucket: '',
    region: '',
    baseUrl: '',
  },
})

const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

function nextStep() {
  if (step.value === 0) {
    step.value = 1
    return
  }
  if (step.value === 1) {
    if (!form.username || !form.password) {
      ElMessage.warning('请填写管理员用户名和密码')
      return
    }
    if (form.password.length < 6) {
      ElMessage.warning('密码长度不能少于6位')
      return
    }
    if (form.password !== form.confirmPassword) {
      ElMessage.warning('两次输入的密码不一致')
      return
    }
  }
  if (step.value < steps.length - 1) {
    step.value++
  }
}

function prevStep() {
  if (step.value > 0) step.value--
}

async function handleSubmit() {
  loading.value = true
  try {
    const res = await api.post('/api/setup/init', {
      username: form.username,
      password: form.password,
      feishu: {
        appId: form.feishu.appId,
        appSecret: form.feishu.appSecret,
        redirectUri: form.feishu.redirectUri,
      },
      cos: {
        secretId: form.cos.secretId,
        secretKey: form.cos.secretKey,
        bucket: form.cos.bucket,
        region: form.cos.region,
        baseUrl: form.cos.baseUrl,
      },
    })
    if (res.data.success) {
      ElMessage.success('系统初始化完成！')
      step.value = steps.length - 1
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '初始化失败')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="setup-page">
    <div class="setup-card">
      <!-- 步骤指示器 -->
      <div class="steps-indicator">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="step-dot"
          :class="{ active: i <= step, current: i === step }"
        >
          <el-icon><component :is="s.icon" /></el-icon>
          <span class="step-label">{{ s.title }}</span>
        </div>
      </div>

      <!-- 步骤 0: 欢迎 -->
      <div v-if="step === 0" class="step-content welcome-step">
        <div class="welcome-icon">
          <el-icon :size="64"><MagicStick /></el-icon>
        </div>
        <h2>欢迎使用播客管理后台</h2>
        <p class="welcome-desc">
          这是您首次访问管理系统，需要先完成初始化设置。
        </p>
        <div class="welcome-features">
          <div class="feature-item">
            <el-icon><UserFilled /></el-icon>
            <span>创建最高管理员账号</span>
          </div>
          <div class="feature-item">
            <el-icon><ChatDotSquare /></el-icon>
            <span>配置飞书应用（可选，用于团队成员登录）</span>
          </div>
          <div class="feature-item">
            <el-icon><Cloudy /></el-icon>
            <span>配置 COS 对象存储（可选，用于媒体文件存储）</span>
          </div>
        </div>
        <el-button type="primary" size="large" @click="nextStep" class="setup-btn">
          开始设置
        </el-button>
      </div>

      <!-- 步骤 1: 管理员账号 -->
      <div v-if="step === 1" class="step-content">
        <h3>创建管理员账号</h3>
        <p class="step-desc">设置最高管理员账号，用于登录管理后台。</p>
        <el-form :model="form" label-width="100px" class="setup-form">
          <el-form-item label="用户名" required>
            <el-input
              v-model="form.username"
              placeholder="输入管理员用户名"
              size="large"
            />
          </el-form-item>
          <el-form-item label="密码" required>
            <el-input
              v-model="form.password"
              type="password"
              :show-password="passwordVisible"
              placeholder="至少6位密码"
              size="large"
            >
              <template #suffix>
                <el-icon @click="passwordVisible = !passwordVisible" style="cursor:pointer">
                  <View v-if="passwordVisible" /><Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="确认密码" required>
            <el-input
              v-model="form.confirmPassword"
              type="password"
              :show-password="confirmPasswordVisible"
              placeholder="再次输入密码"
              size="large"
            >
              <template #suffix>
                <el-icon @click="confirmPasswordVisible = !confirmPasswordVisible" style="cursor:pointer">
                  <View v-if="confirmPasswordVisible" /><Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <!-- 步骤 2: 飞书配置 -->
      <div v-if="step === 2" class="step-content">
        <h3>飞书应用配置（可选）</h3>
        <p class="step-desc">配置飞书开放平台应用，团队成员可通过飞书登录管理系统。如不配置，仅可使用管理员账号登录。</p>
        <el-form :model="form.feishu" label-width="120px" class="setup-form">
          <el-form-item label="App ID">
            <el-input v-model="form.feishu.appId" placeholder="飞书应用 App ID" size="large" />
          </el-form-item>
          <el-form-item label="App Secret">
            <el-input v-model="form.feishu.appSecret" type="password" placeholder="飞书应用 App Secret" size="large" show-password />
          </el-form-item>
          <el-form-item label="回调地址">
            <el-input v-model="form.feishu.redirectUri" placeholder="OAuth 回调地址，如 https://yourdomain.com/api/auth/callback" size="large" />
          </el-form-item>
        </el-form>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <!-- 步骤 3: COS 配置 -->
      <div v-if="step === 3" class="step-content">
        <h3>COS 对象存储配置（可选）</h3>
        <p class="step-desc">配置腾讯云对象存储，用于存储音频/视频文件。如不配置，上传功能将不可用。</p>
        <el-form :model="form.cos" label-width="120px" class="setup-form">
          <el-form-item label="SecretId">
            <el-input v-model="form.cos.secretId" placeholder="腾讯云 API 密钥 SecretId" size="large" />
          </el-form-item>
          <el-form-item label="SecretKey">
            <el-input v-model="form.cos.secretKey" type="password" placeholder="腾讯云 API 密钥 SecretKey" size="large" show-password />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="存储桶">
                <el-input v-model="form.cos.bucket" placeholder="Bucket 名称" size="large" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="地域">
                <el-input v-model="form.cos.region" placeholder="如 ap-guangzhou" size="large" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="访问域名">
            <el-input v-model="form.cos.baseUrl" placeholder="CDN 加速域名（可选）" size="large" />
          </el-form-item>
        </el-form>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <!-- 步骤 4: 完成 -->
      <div v-if="step === 4" class="step-content complete-step">
        <div class="complete-icon">
          <el-icon :size="64" style="color:#67c23a"><Select /></el-icon>
        </div>
        <h2>初始化完成！</h2>
        <p class="complete-desc">系统已成功初始化，现在可以使用管理员账号登录了。</p>
        <div class="complete-info">
          <p><strong>管理员：</strong>{{ form.username }}</p>
          <p v-if="form.feishu.appId"><strong>飞书：</strong>已配置</p>
          <p v-if="form.cos.secretId"><strong>COS：</strong>已配置</p>
        </div>
        <el-button type="primary" size="large" @click="goToLogin" class="setup-btn">
          前往登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}
.setup-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.steps-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
}
.steps-indicator::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 30px;
  right: 30px;
  height: 2px;
  background: #e4e7ed;
  z-index: 0;
}
.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
  color: #dcdfe6;
  font-size: 20px;
}
.step-dot.active {
  color: #409eff;
}
.step-dot.current .step-label {
  color: #409eff;
  font-weight: 600;
}
.step-label {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}
.step-content {
  text-align: center;
}
.step-content h3 {
  font-size: 22px;
  color: #303133;
  margin: 0 0 8px;
}
.step-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 32px;
}
.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
}
.setup-form {
  text-align: left;
}
.welcome-icon {
  color: #409eff;
  margin-bottom: 16px;
}
.welcome-step h2 {
  font-size: 24px;
  margin: 0 0 12px;
  color: #303133;
}
.welcome-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px;
}
.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  text-align: left;
  padding: 0 20px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}
.feature-item .el-icon {
  color: #67c23a;
  font-size: 18px;
}
.setup-btn {
  min-width: 200px;
}
.complete-icon {
  margin-bottom: 16px;
}
.complete-step h2 {
  font-size: 24px;
  margin: 0 0 12px;
  color: #303133;
}
.complete-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 20px;
}
.complete-info {
  text-align: left;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 32px;
}
.complete-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}
</style>