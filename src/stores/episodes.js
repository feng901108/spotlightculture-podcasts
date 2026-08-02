import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const useEpisodeStore = defineStore('episodes', {
  state: () => ({
    episodes: [],
    loading: false,
    currentEpisode: null,
  }),

  actions: {
    async fetchEpisodes() {
      this.loading = true
      try {
        const res = await api.get('/api/episodes')
        this.episodes = res.data || []
      } catch (e) {
        console.warn('获取节目列表失败:', e)
        // 本地兜底
        this.loadLocalEpisodes()
      } finally {
        this.loading = false
      }
    },

    async getEpisode(id) {
      this.loading = true
      try {
        const res = await api.get(`/api/episodes/${id}`)
        this.currentEpisode = res.data
        return res.data
      } catch (e) {
        console.error('获取节目详情失败:', e)
        const local = this.episodes.find((ep) => ep.id === id)
        this.currentEpisode = local || null
        return this.currentEpisode
      } finally {
        this.loading = false
      }
    },

    async saveEpisode(episode) {
      this.loading = true
      try {
        if (episode.id) {
          await api.put(`/api/episodes/${episode.id}`, episode)
        } else {
          await api.post('/api/episodes', episode)
        }
        await this.fetchEpisodes()
        return true
      } catch (e) {
        console.error('保存节目失败:', e)
        // 本地兜底保存
        this.saveLocalEpisode(episode)
        return false
      } finally {
        this.loading = false
      }
    },

    async deleteEpisode(id) {
      this.loading = true
      try {
        await api.delete(`/api/episodes/${id}`)
        this.episodes = this.episodes.filter((ep) => ep.id !== id)
        return true
      } catch (e) {
        console.error('删除节目失败:', e)
        return false
      } finally {
        this.loading = false
      }
    },

    // 本地存储兜底
    loadLocalEpisodes() {
      try {
        const saved = localStorage.getItem('episodes')
        if (saved) {
          this.episodes = JSON.parse(saved)
        }
      } catch (e) {
        console.warn('加载本地节目失败:', e)
      }
    },

    saveLocalEpisode(episode) {
      this.loadLocalEpisodes()
      if (episode.id) {
        const idx = this.episodes.findIndex((ep) => ep.id === episode.id)
        if (idx >= 0) {
          this.episodes[idx] = episode
        }
      } else {
        episode.id = String(Date.now())
        episode.createdAt = new Date().toISOString()
        this.episodes.push(episode)
      }
      localStorage.setItem('episodes', JSON.stringify(this.episodes))
    },
  },
})