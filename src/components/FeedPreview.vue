<script setup>
import { usePodcastStore } from '@/stores/podcast'
import { ElMessage } from 'element-plus'

const podcastStore = usePodcastStore()

function copyFeedUrl() {
  navigator.clipboard.writeText(podcastStore.feedUrl).then(() => {
    ElMessage.success('RSS Feed 地址已复制')
  })
}
</script>

<template>
  <div class="feed-url-bar" v-if="podcastStore.feedUrl">
    <el-icon><Link /></el-icon>
    <span>RSS Feed 地址：</span>
    <a :href="podcastStore.feedUrl" target="_blank">{{ podcastStore.feedUrl }}</a>
    <el-button type="primary" link size="small" @click="copyFeedUrl">
      <el-icon><CopyDocument /></el-icon> 复制
    </el-button>
  </div>
</template>