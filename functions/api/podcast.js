// EdgeOne Pages Node Function - 播客设置 API
// 路由: /api/podcast
// GET: 公开（供 RSS Feed 和前台页面读取）
// PUT: 需登录（管理后台写入）

import { requireAuth } from './auth-middleware.js'

const KV_KEY = 'podcast_settings'

export async function onRequest(context) {
  const { request, env } = context
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (request.method === 'GET') {
      // 公开 - 获取播客设置
      const settings = await env.PODCAST_KV.get(KV_KEY, 'json')
      return new Response(JSON.stringify(settings || {}), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (request.method === 'PUT') {
      // 需登录 - 更新播客设置
      const auth = await requireAuth(request, env)
      if (!auth.authenticated) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      const body = await request.json()
      await env.PODCAST_KV.put(KV_KEY, JSON.stringify(body))
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
