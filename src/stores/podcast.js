import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const usePodcastStore = defineStore('podcast', {
  state: () => ({
    settings: {
      title: '',
      author: '',
      description: '',
      language: 'zh-cn',
      category: '',
      subcategory: '',
      image: '',
      imageUrl: '',
      explicit: 'false',
      link: '',
      ownerName: '',
      ownerEmail: '',
      copyright: '',
    },
    loading: false,
  }),

  getters: {
    feedUrl: (state) => {
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/feed.xml`
      }
      return ''
    },
  },

  actions: {
    async fetchSettings() {
      this.loading = true
      try {
        const res = await api.get('/api/podcast')
        if (res.data) {
          this.settings = { ...this.settings, ...res.data }
        }
      } catch (e) {
        // 如果 API 不可用，使用默认值
        console.warn('获取播客设置失败，使用默认值:', e)
      } finally {
        this.loading = false
      }
    },

    async saveSettings() {
      this.loading = true
      try {
        await api.put('/api/podcast', this.settings)
        return true
      } catch (e) {
        console.error('保存播客设置失败:', e)
        // 本地保存兜底
        localStorage.setItem('podcast_settings', JSON.stringify(this.settings))
        return false
      } finally {
        this.loading = false
      }
    },

    loadLocalSettings() {
      try {
        const saved = localStorage.getItem('podcast_settings')
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) }
        }
      } catch (e) {
        console.warn('加载本地设置失败:', e)
      }
    },
  },
})