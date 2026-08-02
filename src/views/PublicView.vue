<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()
const podcast = ref({})
const episodes = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [podcastRes, episodesRes] = await Promise.all([
      api.get('/api/podcast'),
      api.get('/api/episodes'),
    ])
    podcast.value = podcastRes.data || {}
    episodes.value = Array.isArray(episodesRes.data) ? episodesRes.data : []
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const feedUrl = computed(() => `${window.location.origin}/feed.xml`)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDuration(secs) {
  if (!secs) return ''
  const s = parseInt(secs, 10)
  if (isNaN(s)) return secs
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}
</script>

<template>
  <div class="public-page">
    <!-- 头部 -->
    <header class="public-header">
      <div class="header-inner">
        <div class="brand">
          <h1>{{ podcast.title || '播客' }}</h1>
          <p class="author" v-if="podcast.author">{{ podcast.author }}</p>
        </div>
        <div class="header-actions">
          <a :href="feedUrl" target="_blank" class="rss-link">
            <el-icon><Promotion /></el-icon> RSS Feed
          </a>
          <el-button text @click="router.push('/admin')">
            <el-icon><Lock /></el-icon> 管理
          </el-button>
        </div>
      </div>
    </header>

    <!-- 封面和描述 -->
    <div class="hero-section" v-if="podcast.image">
      <div class="hero-inner">
        <div class="hero-cover">
          <img :src="podcast.image" :alt="podcast.title" />
        </div>
        <div class="hero-info">
          <h2>{{ podcast.title }}</h2>
          <p class="hero-author">{{ podcast.author }}</p>
          <p class="hero-desc">{{ podcast.description }}</p>
          <div class="hero-meta">
            <span v-if="podcast.category">
              <el-icon><Collection /></el-icon> {{ podcast.category }}
              <template v-if="podcast.subcategory"> / {{ podcast.subcategory }}</template>
            </span>
            <span>
              <el-icon><List /></el-icon> {{ episodes.length }} 集
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 节目列表 -->
    <main class="public-main">
      <h3 class="section-title">全部节目</h3>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="episodes.length === 0" class="empty-state">
        <el-icon :size="48" style="color:#dcdfe6"><Microphone /></el-icon>
        <p>暂无节目</p>
      </div>

      <div v-else class="episode-list">
        <div v-for="ep in episodes" :key="ep.id" class="episode-item">
          <div class="episode-main">
            <div class="episode-badge" v-if="ep.season || ep.episode">
              S{{ ep.season || '?' }}E{{ ep.episode || '?' }}
            </div>
            <div class="episode-body">
              <h4 class="episode-title">{{ ep.title }}</h4>
              <p class="episode-desc" v-if="ep.description">{{ ep.description }}</p>
              <div class="episode-meta">
                <span v-if="ep.pubDate">
                  <el-icon><Calendar /></el-icon> {{ formatDate(ep.pubDate) }}
                </span>
                <span v-if="ep.duration">
                  <el-icon><Timer /></el-icon> {{ formatDuration(ep.duration) }}
                </span>
                <span v-if="ep.fileUrl">
                  <el-icon><VideoPlay /></el-icon>
                  {{ ep.fileType === 'video' ? '视频' : '音频' }}
                </span>
                <el-tag v-if="ep.episodeType === 'trailer'" size="small" type="warning">预告</el-tag>
                <el-tag v-if="ep.episodeType === 'bonus'" size="small" type="info">Bonus</el-tag>
              </div>
            </div>
          </div>
          <div class="episode-play" v-if="ep.fileUrl">
            <audio v-if="ep.fileType !== 'video'" :src="ep.fileUrl" controls preload="none" style="height:40px;width:280px"></audio>
            <el-button v-else text type="primary" @click="window.open(ep.fileUrl, '_blank')">
              <el-icon><VideoPlay /></el-icon> 播放视频
            </el-button>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="public-footer">
      <p v-if="podcast.copyright">{{ podcast.copyright }}</p>
      <p><a :href="feedUrl" target="_blank">订阅 RSS Feed</a></p>
    </footer>
  </div>
</template>

<style scoped>
.public-page {
  min-height: 100vh;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.public-header {
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}
.header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand h1 {
  font-size: 20px;
  margin: 0;
  color: #303133;
}
.brand .author {
  font-size: 13px;
  color: #909399;
  margin: 2px 0 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.rss-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f60;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
.rss-link:hover {
  text-decoration: underline;
}

.hero-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  padding: 40px 24px;
}
.hero-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.hero-cover {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-info h2 {
  font-size: 28px;
  margin: 0 0 4px;
  color: #303133;
}
.hero-author {
  font-size: 15px;
  color: #606266;
  margin: 0 0 12px;
}
.hero-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 16px;
}
.hero-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}
.hero-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.public-main {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}
.section-title {
  font-size: 20px;
  margin: 0 0 24px;
  color: #303133;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.episode-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.episode-item:last-child {
  border-bottom: none;
}
.episode-main {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.episode-badge {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  height: fit-content;
}
.episode-body {
  flex: 1;
  min-width: 0;
}
.episode-title {
  font-size: 16px;
  margin: 0 0 6px;
  color: #303133;
}
.episode-desc {
  font-size: 13px;
  color: #606266;
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.episode-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
  align-items: center;
}
.episode-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}
.episode-play {
  flex-shrink: 0;
}

.public-footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid #e4e7ed;
  color: #909399;
  font-size: 13px;
}
.public-footer a {
  color: #f60;
  text-decoration: none;
}
.public-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .hero-inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .hero-cover {
    width: 160px;
    height: 160px;
  }
  .hero-meta {
    justify-content: center;
  }
  .episode-item {
    flex-direction: column;
  }
  .episode-play audio {
    width: 100%;
  }
}
</style>
