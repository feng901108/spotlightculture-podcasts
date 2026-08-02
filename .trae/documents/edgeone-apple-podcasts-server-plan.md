# 基于 EdgeOne 搭建 Apple Podcasts 播客服务器

## 概述

使用腾讯云 EdgeOne Pages（全栈托管平台）+ COS（对象存储）搭建一个兼容 Apple Podcasts 标准的播客服务器，支持提交音频和视频节目，自动生成符合 Apple Podcasts 规范的 RSS Feed。

## 架构设计

```
用户浏览器 (Admin Panel)           Apple Podcasts / 播客客户端
        │                                  │
        ▼                                  ▼
┌───────────────────────────────────────────────┐
│           EdgeOne Pages (全球加速)              │
│  ┌─────────────────────┐  ┌─────────────────┐ │
│  │  静态资源 (Vue SPA)   │  │ Node Functions   │ │
│  │  - 管理后台           │  │  - RSS Feed 生成  │ │
│  │  - 节目列表           │  │  - 节目 CRUD API  │ │
│  │  - 上传页面           │  │  - 文件上传签名    │ │
│  └─────────────────────┘  └─────────────────┘ │
└───────────────────────┬───────────────────────┘
                        │
┌───────────────────────▼───────────────────────┐
│        COS (Cloud Object Storage)              │
│  - 音频文件 (.mp3, .m4a)                       │
│  - 视频文件 (.mp4, .m4v)                       │
│  - 播客封面图 (1400x1400px)                    │
│  - 节目详情/元数据 (JSON)                       │
└───────────────────────────────────────────────┘
```

## 当前状态分析

- 项目目录为空，完全从零开始
- 使用技术栈：Vue 3 + Vite（前端）、Node.js（Edge Functions）、COS（存储）
- 无现有配置文件或代码

## 详细实施步骤

### 步骤 1: 项目初始化

**文件**: `package.json`, `vite.config.js`, `index.html`, `src/main.js`

**操作**:
- 使用 `npm create vite@latest` 创建 Vue 3 项目
- 安装依赖：vue-router, pinia, axios, element-plus (UI 库)
- 配置 Vite 构建输出到 `dist/` 目录
- 配置项目基础信息

### 步骤 2: 前端管理后台 - 播客设置页

**文件**: `src/views/SettingsView.vue`, `src/stores/podcast.js`

**操作**:
- 播客基本信息设置（标题、作者、描述、分类、语言、显式内容标记）
- 播客封面图上传（限制 1400x1400 以上）
- 播客分类选择（支持 Apple Podcasts 标准分类如 Arts, Business, Comedy 等）
- 设置存储到 KV 或本地 JSON

### 步骤 3: 前端管理后台 - 节目管理页

**文件**: `src/views/EpisodesView.vue`, `src/views/EpisodeEditView.vue`, `src/stores/episodes.js`

**操作**:
- 节目列表展示（标题、发布时间、时长、状态）
- 新建/编辑节目表单
  - 标题、描述、节目备注
  - 音频/视频文件上传（支持 mp3, m4a, mp4, m4v）
  - 季节号、集号
  - 节目类型（完整/预告/Bonus）
  - 显式内容标记
  - 发布时间设定
- 文件上传进度显示
- 删除节目功能

### 步骤 4: 文件上传服务

**文件**: `src/services/upload.js`, `functions/api/upload.js`

**操作**:
- 前端通过预签名 URL 上传文件到 COS
- 支持大文件分片上传
- 文件类型限制和校验
- 上传完成后回调更新节目元数据

### 步骤 5: Node Functions - REST API

**文件**: `functions/api/episodes.js`, `functions/api/podcast.js`, `functions/api/upload.js`

**操作**:
- `GET /api/podcast` - 获取播客设置
- `PUT /api/podcast` - 更新播客设置
- `GET /api/episodes` - 获取节目列表
- `POST /api/episodes` - 创建节目
- `PUT /api/episodes/:id` - 更新节目
- `DELETE /api/episodes/:id` - 删除节目
- `POST /api/upload/presign` - 获取文件上传预签名 URL
- 使用 EdgeOne Pages KV 存储元数据

### 步骤 6: RSS Feed 生成 (核心)

**文件**: `functions/feed.xml.js` (或 `functions/feed.js`)

**操作**:
- 生成符合 Apple Podcasts 规范的 RSS 2.0 Feed
- 包含必要的 iTunes 命名空间标签：
  - `<itunes:author>` - 作者
  - `<itunes:summary>` - 摘要
  - `<itunes:category>` - 分类
  - `<itunes:image>` - 封面图
  - `<itunes:explicit>` - 显式内容
  - `<itunes:duration>` - 时长
  - `<itunes:season>` / `<itunes:episode>` - 季节/集号
  - `<itunes:episodeType>` - 节目类型
- 每个 `<item>` 包含：
  - `<title>` - 标题
  - `<description>` - 描述
  - `<enclosure>` - 音频/视频文件链接（url, length, type）
  - `<guid>` - 唯一标识
  - `<pubDate>` - 发布日期
  - `<duration>` - 时长
- 输出路径: `/feed.xml` 或 `/podcast.xml`

### 步骤 7: 前端路由与导航

**文件**: `src/router/index.js`, `src/App.vue`

**操作**:
- 路由设计：
  - `/` - 仪表盘/概览
  - `/settings` - 播客设置
  - `/episodes` - 节目列表
  - `/episodes/new` - 新建节目
  - `/episodes/:id/edit` - 编辑节目
- 侧边栏导航
- 响应式布局

### 步骤 8: EdgeOne 部署配置

**文件**: `edgeone.json`, `functions/` 目录结构

**操作**:
- 配置 EdgeOne Pages 项目
- 配置 Node Functions 路由
- 配置 COS 存储桶
- 配置自定义域名和 HTTPS
- 配置 CDN 缓存策略（RSS Feed 不缓存，媒体文件长期缓存）

### 步骤 9: Apple Podcasts 提交准备

**操作**:
- 确保 RSS Feed 通过 HTTPS 可访问
- 验证 Feed 符合 Apple Podcasts 规范
- 提供 Apple Podcasts Connect 提交链接引导
- 提供常用验证工具指引（如 CastFeedValidator）

## 目录结构

```
/Users/fengjing/Code/Apple Podcasts/
├── package.json
├── vite.config.js
├── index.html
├── edgeone.json                    # EdgeOne Pages 配置
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   ├── podcast.js              # 播客设置 store
│   │   └── episodes.js             # 节目管理 store
│   ├── services/
│   │   ├── api.js                  # API 请求封装
│   │   └── upload.js               # 上传服务
│   ├── views/
│   │   ├── DashboardView.vue       # 仪表盘
│   │   ├── SettingsView.vue        # 播客设置
│   │   ├── EpisodesView.vue        # 节目列表
│   │   └── EpisodeEditView.vue     # 节目编辑
│   ├── components/
│   │   ├── AppSidebar.vue
│   │   ├── EpisodeCard.vue
│   │   ├── FileUploader.vue
│   │   └── FeedPreview.vue
│   └── assets/
│       └── styles/
│           └── main.css
├── functions/
│   ├── feed.xml.js                 # RSS Feed 生成 (Edge Function)
│   └── api/
│       ├── podcast.js              # 播客设置 API
│       ├── episodes.js             # 节目 CRUD API
│       └── upload.js               # 上传预签名 API
└── dist/                           # 构建输出
```

## 关键决策

1. **UI 框架**: 使用 Element Plus，与 Vue 3 生态兼容，提供成熟的后台组件
2. **元数据存储**: 使用 EdgeOne Pages KV 存储播客设置和节目元数据，轻量且无需额外数据库
3. **媒体存储**: 使用 COS 对象存储，通过预签名 URL 实现安全上传
4. **RSS 路由**: 使用 `/feed.xml` 路径，EdgeOne Node Functions 直接响应此路径
5. **Apple Podcasts 兼容**: 严格遵循 Apple 官方 RSS 规范，包含所有必要的 iTunes 命名空间标签

## 验证步骤

1. 本地开发：`npm run dev` 启动前端开发服务器
2. 本地测试：`npm run build` 确认构建成功
3. RSS Feed 验证：使用 CastFeedValidator 或 Podbase 验证生成的 RSS Feed
4. Apple Podcasts 提交：通过 Apple Podcasts Connect 提交 RSS Feed URL
5. 功能验证：上传测试音频/视频文件，确认播放正常

## 前提条件

- 腾讯云账号（已开通 EdgeOne Pages 和 COS 服务）
- Node.js 18+ 本地开发环境
- 自定义域名（可选，用于 Apple Podcasts 提交）