<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePodcastStore } from '@/stores/podcast'
import { useEpisodeStore } from '@/stores/episodes'
import FeedPreview from '@/components/FeedPreview.vue'

const router = useRouter()
const podcastStore = usePodcastStore()
const episodeStore = useEpisodeStore()

const episodeCount = computed(() => episodeStore.episodes.length)
const latestEpisode = computed(() => {
  if (episodeStore.episodes.length === 0) return null
  return [...episodeStore.episodes].sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))[0]
})

onMounted(() => {
  podcastStore.fetchSettings()
  episodeStore.fetchEpisodes()
})
</script>

<template>
  <div>
    <FeedPreview />

    <div class="stats-grid">
      <el-card shadow="hover" class="stat-card" @click="router.push('/admin/episodes')">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-label">节目总数</div>
            <div class="stat-value">{{ episodeCount }}</div>
          </div>
          <el-icon class="stat-icon" :size="40"><List /></el-icon>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card" @click="router.push('/admin/settings')">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-label">播客设置</div>
            <div class="stat-value" style="font-size:14px">{{ podcastStore.settings.title || '未设置' }}</div>
          </div>
          <el-icon class="stat-icon" :size="40"><Setting /></el-icon>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card" @click="router.push('/admin/episodes/new')">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-label">快捷操作</div>
            <div class="stat-value" style="font-size:14px;color:#409eff">发布新节目</div>
          </div>
          <el-icon class="stat-icon" :size="40"><Plus /></el-icon>
        </div>
      </el-card>
    </div>

    <el-card class="page-card" style="margin-top:24px" v-if="latestEpisode">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>最近节目</span>
          <el-button text type="primary" @click="router.push('/admin/episodes')">查看全部</el-button>
        </div>
      </template>
      <div class="latest-episode">
        <h4>{{ latestEpisode.title }}</h4>
        <p>{{ latestEpisode.description }}</p>
        <div class="latest-episode-meta">
          <span v-if="latestEpisode.pubDate">发布日期: {{ new Date(latestEpisode.pubDate).toLocaleDateString('zh-CN') }}</span>
          <span v-if="latestEpisode.fileUrl">文件已上传</span>
        </div>
      </div>
    </el-card>

    <el-card class="page-card" style="margin-top:24px">
      <template #header>
        <span>Apple Podcasts 提交指南</span>
      </template>
      <div class="guide-content">
        <ol>
          <li>在播客设置中填写完整的播客信息并保存</li>
          <li>上传至少一个节目（音频或视频）</li>
          <li>确认上方的 RSS Feed 地址可正常访问</li>
          <li>使用 <a href="https://castfeedvalidator.com" target="_blank">CastFeedValidator</a> 验证 Feed 格式</li>
          <li>前往 <a href="https://podcastsconnect.apple.com" target="_blank">Apple Podcasts Connect</a> 提交 RSS Feed</li>
        </ol>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}
.stat-icon {
  color: #dcdfe6;
}
.latest-episode h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.latest-episode p {
  color: #606266;
  font-size: 13px;
  margin: 0 0 8px;
}
.latest-episode-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
.guide-content ol {
  padding-left: 20px;
  line-height: 2;
}
.guide-content a {
  color: #409eff;
  text-decoration: none;
}
.guide-content a:hover {
  text-decoration: underline;
}
</style>