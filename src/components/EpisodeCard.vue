<script setup>
import { computed } from 'vue'

const props = defineProps({
  episode: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete'])

const durationFormatted = computed(() => {
  if (!props.episode.duration) return ''
  const secs = parseInt(props.episode.duration, 10)
  if (isNaN(secs)) return props.episode.duration
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
})

const pubDateFormatted = computed(() => {
  if (!props.episode.pubDate) return ''
  const d = new Date(props.episode.pubDate)
  return d.toLocaleDateString('zh-CN')
})

const episodeTypeLabel = computed(() => {
  const map = { full: '完整', trailer: '预告', bonus: 'Bonus' }
  return map[props.episode.episodeType] || '完整'
})
</script>

<template>
  <el-card shadow="hover" class="episode-card">
    <div class="episode-card-content">
      <div class="episode-info">
        <div class="episode-title-row">
          <span class="episode-season" v-if="episode.season || episode.episode">
            S{{ episode.season || '?' }}E{{ episode.episode || '?' }}
          </span>
          <h4 class="episode-title">{{ episode.title }}</h4>
          <el-tag :type="episode.episodeType === 'full' ? 'success' : episode.episodeType === 'trailer' ? 'warning' : 'info'" size="small">
            {{ episodeTypeLabel }}
          </el-tag>
          <el-tag v-if="episode.explicit === 'yes'" type="danger" size="small" style="margin-left:4px">
            显式
          </el-tag>
        </div>
        <p class="episode-desc">{{ episode.description || '暂无描述' }}</p>
        <div class="episode-meta">
          <span v-if="pubDateFormatted">
            <el-icon><Calendar /></el-icon> {{ pubDateFormatted }}
          </span>
          <span v-if="durationFormatted">
            <el-icon><Timer /></el-icon> {{ durationFormatted }}
          </span>
          <span v-if="episode.fileUrl">
            <el-icon><Link /></el-icon> {{ episode.fileType === 'video' ? '视频' : '音频' }}
          </span>
        </div>
      </div>
      <div class="episode-actions">
        <el-button type="primary" link @click="emit('edit', episode)">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
        <el-button type="danger" link @click="emit('delete', episode)">
          <el-icon><Delete /></el-icon> 删除
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.episode-card {
  margin-bottom: 12px;
}
.episode-card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.episode-info {
  flex: 1;
  min-width: 0;
}
.episode-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.episode-season {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.episode-title {
  font-size: 16px;
  margin: 0;
  color: #303133;
}
.episode-desc {
  font-size: 13px;
  color: #606266;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.episode-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
.episode-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.episode-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}
</style>