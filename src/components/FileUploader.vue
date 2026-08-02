<script setup>
import { ref } from 'vue'
import { uploadFile } from '@/services/upload'
import { ElMessage } from 'element-plus'

const props = defineProps({
  accept: { type: String, default: '.mp3,.m4a,.mp4,.m4v' },
  fileType: { type: String, default: 'audio' },
})

const emit = defineEmits(['upload-success'])

const uploading = ref(false)
const progress = ref(0)
const fileName = ref('')

async function handleFileChange(file) {
  if (!file) return
  uploading.value = true
  progress.value = 0
  fileName.value = file.name

  try {
    const result = await uploadFile(file, (pct) => {
      progress.value = pct
    })
    emit('upload-success', {
      fileUrl: result.fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: props.fileType,
    })
    ElMessage.success('上传成功')
  } catch (e) {
    ElMessage.error('上传失败: ' + (e.message || '未知错误'))
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function handleBeforeUpload(file) {
  const maxSize = 1024 * 1024 * 1024 // 1GB
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过 1GB')
    return false
  }
  return true
}
</script>

<template>
  <div class="file-uploader">
    <el-upload
      drag
      :accept="accept"
      :auto-upload="false"
      :show-file-list="false"
      :before-upload="handleBeforeUpload"
      :on-change="(uploadFile) => handleFileChange(uploadFile.raw)"
    >
      <el-icon class="upload-icon" :size="48"><UploadFilled /></el-icon>
      <div class="upload-text">
        <span v-if="!uploading">将文件拖拽到此处，或<em>点击上传</em></span>
        <span v-else>上传中...</span>
      </div>
      <template #tip>
        <div class="upload-tip">
          支持 mp3, m4a, mp4, m4v 格式，最大 1GB
        </div>
      </template>
    </el-upload>
    <div v-if="uploading" class="upload-progress">
      <el-progress :percentage="progress" :status="progress === 100 ? 'success' : undefined" />
      <p v-if="fileName" class="upload-filename">{{ fileName }}</p>
    </div>
  </div>
</template>

<style scoped>
.file-uploader {
  width: 100%;
}
.upload-icon {
  margin-bottom: 8px;
}
.upload-text {
  font-size: 14px;
  color: #606266;
}
.upload-text em {
  color: #409eff;
  font-style: normal;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
.upload-progress {
  margin-top: 16px;
}
.upload-filename {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  text-align: center;
}
</style>