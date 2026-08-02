<script setup>
import { onMounted, reactive, computed } from 'vue'
import { usePodcastStore } from '@/stores/podcast'
import { ElMessage } from 'element-plus'
import FeedPreview from '@/components/FeedPreview.vue'

const podcastStore = usePodcastStore()

const form = reactive({ ...podcastStore.settings })

const categories = [
  { label: '艺术 (Arts)', value: 'Arts', children: ['Design', 'Fashion & Beauty', 'Food', 'Literature', 'Performing Arts', 'Visual Arts'] },
  { label: '商业 (Business)', value: 'Business', children: ['Careers', 'Entrepreneurship', 'Investing', 'Management', 'Marketing', 'Non-Profit'] },
  { label: '喜剧 (Comedy)', value: 'Comedy', children: ['Comedy Interviews', 'Improv', 'Stand-Up'] },
  { label: '教育 (Education)', value: 'Education', children: ['Courses', 'How To', 'Language Learning', 'Self-Improvement'] },
  { label: '娱乐 (Entertainment)', value: 'Entertainment', children: ['Animation & Manga', 'Books', 'Film History', 'Games', 'Music', 'TV & Film'] },
  { label: '健康 (Health & Fitness)', value: 'Health & Fitness', children: ['Alternative Health', 'Fitness', 'Medicine', 'Mental Health', 'Nutrition', 'Sexuality'] },
  { label: '历史 (History)', value: 'History', children: [] },
  { label: '科技 (Technology)', value: 'Technology', children: [] },
  { label: '新闻 (News)', value: 'News', children: ['Business News', 'Daily News', 'Entertainment News', 'News Commentary', 'Politics', 'Sports News', 'Tech News'] },
  { label: '科学 (Science)', value: 'Science', children: ['Astronomy', 'Chemistry', 'Earth Sciences', 'Life Sciences', 'Mathematics', 'Natural Sciences', 'Nature', 'Physics', 'Social Sciences'] },
  { label: '社会 (Society & Culture)', value: 'Society & Culture', children: ['Documentary', 'Personal Journals', 'Philosophy', 'Places & Travel', 'Relationships'] },
  { label: '体育 (Sports)', value: 'Sports', children: ['Baseball', 'Basketball', 'Cricket', 'Fantasy Sports', 'Football', 'Golf', 'Hockey', 'Rugby', 'Running', 'Soccer', 'Swimming', 'Tennis', 'Volleyball', 'Wilderness', 'Winter Sports'] },
  { label: '真实犯罪 (True Crime)', value: 'True Crime', children: [] },
]

const subcategories = computed(() => {
  const cat = categories.find((c) => c.value === form.category)
  return cat ? cat.children : []
})

function onCategoryChange() {
  form.subcategory = ''
}

async function handleSave() {
  Object.assign(podcastStore.settings, { ...form })
  const ok = await podcastStore.saveSettings()
  if (ok) {
    ElMessage.success('播客设置已保存')
  } else {
    ElMessage.warning('设置已保存到本地（API 不可用）')
  }
}

onMounted(() => {
  podcastStore.loadLocalSettings()
  Object.assign(form, { ...podcastStore.settings })
})
</script>

<template>
  <div>
    <FeedPreview />

    <div class="page-card">
      <el-form :model="form" label-width="120px" label-position="top">
        <h4 style="margin-bottom:16px">基本信息</h4>

        <el-form-item label="播客标题" required>
          <el-input v-model="form.title" placeholder="输入播客名称" />
        </el-form-item>

        <el-form-item label="作者" required>
          <el-input v-model="form.author" placeholder="输入作者/主播名" />
        </el-form-item>

        <el-form-item label="描述" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="描述你的播客内容"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="语言">
              <el-select v-model="form.language" style="width:100%">
                <el-option label="中文 (简体)" value="zh-cn" />
                <el-option label="中文 (繁體)" value="zh-tw" />
                <el-option label="English" value="en" />
                <el-option label="日本語" value="ja" />
                <el-option label="한국어" value="ko" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显式内容">
              <el-select v-model="form.explicit" style="width:100%">
                <el-option label="否" value="false" />
                <el-option label="是" value="true" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="播客分类" required>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-select v-model="form.category" style="width:100%" placeholder="选择主分类" @change="onCategoryChange">
                <el-option
                  v-for="cat in categories"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select v-model="form.subcategory" style="width:100%" placeholder="选择子分类（可选）" :disabled="subcategories.length === 0">
                <el-option
                  v-for="sub in subcategories"
                  :key="sub"
                  :label="sub"
                  :value="sub"
                />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="播客网站链接">
          <el-input v-model="form.link" placeholder="https://example.com" />
        </el-form-item>

        <el-divider />

        <h4 style="margin-bottom:16px">版权与所有者</h4>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所有者名称">
              <el-input v-model="form.ownerName" placeholder="所有者姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所有者邮箱">
              <el-input v-model="form.ownerEmail" placeholder="owner@example.com" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="版权信息">
          <el-input v-model="form.copyright" placeholder="例如: © 2024 Your Name" />
        </el-form-item>

        <el-divider />

        <h4 style="margin-bottom:16px">播客封面图</h4>

        <el-form-item label="封面图 URL">
          <el-input v-model="form.image" placeholder="封面图直链（1400x1400 像素以上）" />
        </el-form-item>
        <el-form-item v-if="form.image">
          <el-image
            :src="form.image"
            style="width:200px;height:200px;border-radius:8px"
            fit="cover"
          >
            <template #error>
              <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#909399;font-size:13px">
                图片加载失败
              </div>
            </template>
          </el-image>
        </el-form-item>

        <el-divider />

        <div style="text-align:right">
          <el-button type="primary" size="large" @click="handleSave" :loading="podcastStore.loading">
            保存设置
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>