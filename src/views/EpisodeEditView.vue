<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEpisodeStore } from '@/stores/episodes'
import { ElMessage } from 'element-plus'
import FileUploader from '@/components/FileUploader.vue'

const route = useRoute()
const router = useRouter()
const episodeStore = useEpisodeStore()

const isEdit = computed(() => !!route.params.id)
const form = reactive({
  title: '',
  description: '',
  season: '',
  episode: '',
  episodeType: 'full',
  explicit: 'false',
  pubDate: '',
  duration: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  fileType: 'audio',
})

const saving = ref(false)

onMounted(async () => {
  if (isEdit.value) {
    const ep = await episodeStore.getEpisode(route.params.id)
    if (ep) {
      Object.assign(form, ep)
    }
  }
})

async function handleSave() {
  if (!form.title) {
    ElMessage.warning('请输入节目标题')
    return
  }

  saving.value = true
  try {
    const episodeData = { ...form }
    if (!isEdit.value) {
      delete episodeData.id
    }
    const ok = await episodeStore.saveEpisode(episodeData)
    if (ok) {
      ElMessage.success(isEdit.value ? '节目已更新' : '节目已创建')
      router.push('/admin/episodes')
    } else {
      ElMessage.warning('节目已保存到本地（API 不可用）')
      router.push('/admin/episodes')
    }
  } finally {
    saving.value = false
  }
}

function handleFileUpload(result) {
  form.fileUrl = result.fileUrl
  form.fileName = result.fileName
  form.fileSize = result.fileSize
  form.fileType = result.fileType
  ElMessage.success('文件已上传')
}

function clearFile() {
  form.fileUrl = ''
  form.fileName = ''
  form.fileSize = 0
}
</script>

<template>
  <div class="page-card">
    <el-form :model="form" label-width="100px" label-position="top">
      <h4 style="margin-bottom:16px">节目信息</h4>

      <el-form-item label="节目标题" required>
        <el-input v-model="form.title" placeholder="输入节目标题" />
      </el-form-item>

      <el-form-item label="节目描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="描述本期节目的内容"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="季节号">
            <el-input-number v-model="form.season" :min="1" :max="999" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="集号">
            <el-input-number v-model="form.episode" :min="1" :max="9999" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="节目类型">
            <el-select v-model="form.episodeType" style="width:100%">
              <el-option label="完整节目 (Full)" value="full" />
              <el-option label="预告 (Trailer)" value="trailer" />
              <el-option label="Bonus" value="bonus" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="发布日期">
            <el-date-picker
              v-model="form.pubDate"
              type="date"
              placeholder="选择发布日期"
              style="width:100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="时长（秒）">
            <el-input v-model="form.duration" placeholder="单位: 秒" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="显式内容">
            <el-select v-model="form.explicit" style="width:100%">
              <el-option label="否" value="false" />
              <el-option label="是" value="true" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider />

      <h4 style="margin-bottom:16px">音频/视频文件</h4>

      <div v-if="!form.fileUrl">
        <el-radio-group v-model="form.fileType" style="margin-bottom:16px">
          <el-radio-button value="audio">音频</el-radio-button>
          <el-radio-button value="video">视频</el-radio-button>
        </el-radio-group>

        <FileUploader
          :accept="form.fileType === 'audio' ? '.mp3,.m4a,.wav' : '.mp4,.m4v,.mov'"
          :file-type="form.fileType"
          @upload-success="handleFileUpload"
        />
      </div>

      <div v-else class="uploaded-file">
        <el-card>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <el-icon :size="24" style="color:#409eff"><Document /></el-icon>
              <span style="margin-left:8px;font-weight:500">{{ form.fileName || '已上传文件' }}</span>
              <el-tag size="small" style="margin-left:8px">{{ form.fileType === 'video' ? '视频' : '音频' }}</el-tag>
            </div>
            <el-button type="danger" text @click="clearFile">
              <el-icon><Delete /></el-icon> 移除
            </el-button>
          </div>
          <div style="margin-top:8px;font-size:12px;color:#909399">
            文件 URL: {{ form.fileUrl }}
          </div>
        </el-card>
      </div>

      <el-divider />

      <div style="display:flex;gap:12px;justify-content:flex-end">
        <el-button @click="router.push('/admin/episodes')">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEdit ? '更新节目' : '创建节目' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.uploaded-file {
  margin-top: 8px;
}
</style>