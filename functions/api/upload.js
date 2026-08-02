// EdgeOne Pages Node Function - 文件上传预签名 URL
// 路由: /api/upload/presign
// 需登录验证

import { requireAuth } from './auth-middleware.js'

export async function onRequest(context) {
  const { request, env } = context
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 需登录
  const auth = await requireAuth(request, env)
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    const body = await request.json()
    const { filename, contentType } = body

    if (!filename) {
      return new Response(JSON.stringify({ error: 'filename is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const ext = filename.split('.').pop()
    const key = `podcasts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // 优先使用环境变量，其次从 KV 配置读取
    let secretId = env.COS_SECRET_ID
    let secretKey = env.COS_SECRET_KEY
    let bucket = env.COS_BUCKET
    let region = env.COS_REGION
    let baseUrl = env.COS_BASE_URL

    if (!secretId) {
      const sysConfig = await env.PODCAST_KV.get('system:config', 'json')
      if (sysConfig?.cos?.secretId) {
        secretId = sysConfig.cos.secretId
        secretKey = sysConfig.cos.secretKey
        bucket = sysConfig.cos.bucket
        region = sysConfig.cos.region
        baseUrl = sysConfig.cos.baseUrl || ''
      }
    }

    if (secretId && secretKey && bucket && region) {
      const host = `${bucket}.cos.${region}.myqcloud.com`
      const uploadUrl = `https://${host}/${key}`

      return new Response(JSON.stringify({
        uploadUrl,
        fileUrl: `${baseUrl || `https://${host}`}/${key}`,
        key,
        method: 'PUT',
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
        },
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({
      uploadUrl: 'https://cos-placeholder.example.com/' + key,
      fileUrl: 'https://cos-placeholder.example.com/' + key,
      key,
      method: 'PUT',
      warning: 'COS not configured, using placeholder URL',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}
