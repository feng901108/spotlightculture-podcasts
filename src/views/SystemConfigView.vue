<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/services/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)

const config = reactive({
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

const feishuAppSecret = ref('')
const cosSecretId = ref('')
const cosSecretKey = ref('')

async function fetchConfig() {
  loading.value = true
  try {
    const res = await api.get('/api/config')
    if (res.data) {
      config.feishu.appId = res.data.feishu?.appId || ''
      config.feishu.redirectUri = res.data.feishu?.redirectUri || ''
      feishuAppSecret.value = res.data.feishu?.appSecret || ''
      config.cos.bucket = res.data.cos?.bucket || ''
      config.cos.region = res.data.cos?.region || ''
      config.cos.baseUrl = res.data.cos?.baseUrl || ''
      cosSecretId.value = res.data.cos?.secretId || ''
      cosSecretKey.value = res.data.cos?.secretKey || ''
    }
  } catch (e) {
    ElMessage.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const payload = {
      feishu: {
        appId: config.feishu.appId,
        appSecret: feishuAppSecret.value,
        redirectUri: config.feishu.redirectUri,
      },
      cos: {
        secretId: cosSecretId.value,
        secretKey: cosSecretKey.value,
        bucket: config.cos.bucket,
        region: config.cos.region,
        baseUrl: config.cos.baseUrl,
      },
    }
    await api.put('/api/config', payload)
    ElMessage.success('配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div>
    <div class="page-card">
      <el-alert
        title="系统配置说明"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom:24px"
      >
        <template #default>
          <p style="margin:4px 0;font-size:13px">
            配置保存后，对应的 API 功能会自动启用。配置存储在 KV 中，修改后即时生效。
          </p>
        </template>
      </el-alert>

      <el-form v-loading="loading" label-width="130px" label-position="top">
        <!-- 飞书配置 -->
        <h4 style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <el-icon><ChatDotSquare /></el-icon> 飞书应用配置
        </h4>
        <p style="font-size:13px;color:#909399;margin-bottom:16px">
          配置后，团队成员可通过飞书扫码登录管理后台。需在<a href="https://open.feishu.cn" target="_blank" style="color:#409eff">飞书开放平台</a>创建应用。
        </p>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="App ID">
              <el-input v-model="config.feishu.appId" placeholder="飞书应用 App ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="App Secret">
              <el-input
                v-model="feishuAppSecret"
                type="password"
                show-password
                :placeholder="feishuAppSecret === '***' ? '已配置，输入新值覆盖' : '输入 App Secret'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="OAuth 回调地址">
          <el-input
            v-model="config.feishu.redirectUri"
            placeholder="如 https://yourdomain.com/api/auth/callback"
          />
          <div style="font-size:12px;color:#909399;margin-top:4px">
            需在飞书开放平台「安全设置」中配置相同地址
          </div>
        </el-form-item>

        <el-divider />

        <!-- COS 配置 -->
        <h4 style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <el-icon><Cloudy /></el-icon> COS 对象存储配置
        </h4>
        <p style="font-size:13px;color:#909399;margin-bottom:16px">
          配置腾讯云对象存储用于存储音频/视频文件。需在<a href="https://console.cloud.tencent.com/cos" target="_blank" style="color:#409eff">腾讯云 COS 控制台</a>创建存储桶。
        </p>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="SecretId">
              <el-input
                v-model="cosSecretId"
                type="password"
                show-password
                :placeholder="cosSecretId === '***' ? '已配置，输入新值覆盖' : '输入 SecretId'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SecretKey">
              <el-input
                v-model="cosSecretKey"
                type="password"
                show-password
                :placeholder="cosSecretKey === '***' ? '已配置，输入新值覆盖' : '输入 SecretKey'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="存储桶">
              <el-input v-model="config.cos.bucket" placeholder="Bucket 名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地域">
              <el-input v-model="config.cos.region" placeholder="如 ap-guangzhou" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="访问域名">
              <el-input v-model="config.cos.baseUrl" placeholder="CDN 域名（可选）" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <div style="text-align:right">
          <el-button type="primary" size="large" @click="handleSave" :loading="saving">
            保存配置
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>