// EdgeOne Pages Node Function - 节目 CRUD API
// 路由: /api/episodes, /api/episodes/:id
// GET: 公开（供前台页面和 RSS Feed 读取）
// POST/PUT/DELETE: 需登录（管理后台操作）

import { requireAuth } from './auth-middleware.js'

const KV_KEY = 'episodes'

export async function onRequest(context) {
  const { request, env } = context
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const episodeId = pathParts.length > 3 ? pathParts[3] : null

    let episodes = await env.PODCAST_KV.get(KV_KEY, 'json')
    episodes = Array.isArray(episodes) ? episodes : []

    if (request.method === 'GET') {
      // 公开 - 获取节目列表或单个节目
      if (episodeId) {
        const episode = episodes.find((ep) => ep.id === episodeId)
        if (!episode) {
          return new Response(JSON.stringify({ error: 'Episode not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        return new Response(JSON.stringify(episode), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      episodes.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
      return new Response(JSON.stringify(episodes), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 以下操作需登录验证
    const auth = await requireAuth(request, env)
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (request.method === 'POST') {
      const body = await request.json()
      const newEpisode = {
        ...body,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        createdBy: auth.user.name,
      }
      episodes.push(newEpisode)
      await env.PODCAST_KV.put(KV_KEY, JSON.stringify(episodes))
      return new Response(JSON.stringify(newEpisode), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (request.method === 'PUT' && episodeId) {
      const index = episodes.findIndex((ep) => ep.id === episodeId)
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Episode not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      const body = await request.json()
      episodes[index] = { ...episodes[index], ...body, id: episodeId, updatedBy: auth.user.name }
      await env.PODCAST_KV.put(KV_KEY, JSON.stringify(episodes))
      return new Response(JSON.stringify(episodes[index]), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (request.method === 'DELETE' && episodeId) {
      const index = episodes.findIndex((ep) => ep.id === episodeId)
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Episode not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      episodes.splice(index, 1)
      await env.PODCAST_KV.put(KV_KEY, JSON.stringify(episodes))
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}
