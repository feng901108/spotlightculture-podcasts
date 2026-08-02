<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEpisodeStore } from '@/stores/episodes'
import { ElMessage, ElMessageBox } from 'element-plus'
import EpisodeCard from '@/components/EpisodeCard.vue'

const router = useRouter()
const episodeStore = useEpisodeStore()

onMounted(() => {
  episodeStore.fetchEpisodes()
})

function editEpisode(episode) {
  router.push(`/admin/episodes/${episode.id}/edit`)
}

async function deleteEpisode(episode) {
  try {
    await ElMessageBox.confirm(`确定删除节目「${episode.title}」吗？此操作不可撤销。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const ok = await episodeStore.deleteEpisode(episode.id)
    if (ok) {
      ElMessage.success('节目已删除')
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div>
        <span style="color:#909399;font-size:14px">共 {{ episodeStore.episodes.length }} 个节目</span>
      </div>
      <el-button type="primary" @click="router.push('/admin/episodes/new')">
        <el-icon><Plus /></el-icon> 新建节目
      </el-button>
    </div>

    <div v-if="episodeStore.loading && episodeStore.episodes.length === 0" style="text-align:center;padding:60px 0">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p style="color:#909399;margin-top:12px">加载中...</p>
    </div>

    <div v-else-if="episodeStore.episodes.length === 0" style="text-align:center;padding:60px 0">
      <el-icon :size="48" style="color:#dcdfe6"><FolderDelete /></el-icon>
      <p style="color:#909399;margin-top:12px">还没有节目，点击右上角新建第一个节目</p>
    </div>

    <div v-else>
      <EpisodeCard
        v-for="ep in episodeStore.episodes"
        :key="ep.id"
        :episode="ep"
        @edit="editEpisode"
        @delete="deleteEpisode"
      />
    </div>
  </div>
</template>