// EdgeOne Pages Node Function - 系统配置 API
// 路由: /api/config
// 需登录验证（管理员）

import { requireAuth } from './auth-middleware.js'

const KV_KEY = 'system:config'

export async function onRequest(context) {
  const { request, env } = context
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 所有操作需登录验证
  const auth = await requireAuth(request, env)
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    if (request.method === 'GET') {
      const config = await env.PODCAST_KV.get(KV_KEY, 'json')
      // 返回配置时隐藏敏感字段
      if (config) {
        const safe = {
          feishu: {
            appId: config.feishu?.appId || '',
            redirectUri: config.feishu?.redirectUri || '',
            // 不返回 appSecret
            appSecret: config.feishu?.appSecret ? '***' : '',
          },
          cos: {
            bucket: config.cos?.bucket || '',
            region: config.cos?.region || '',
            baseUrl: config.cos?.baseUrl || '',
            // 不返回密钥
            secretId: config.cos?.secretId ? '***' : '',
            secretKey: config.cos?.secretKey ? '***' : '',
          },
          updatedAt: config.updatedAt || '',
        }
        return new Response(JSON.stringify(safe), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      return new Response(JSON.stringify({
        feishu: { appId: '', appSecret: '', redirectUri: '' },
        cos: { secretId: '', secretKey: '', bucket: '', region: '', baseUrl: '' },
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (request.method === 'PUT') {
      const body = await request.json()
      const { feishu, cos } = body

      // 获取当前配置，保留未传的字段
      const current = await env.PODCAST_KV.get(KV_KEY, 'json') || {}

      const updated = {
        feishu: {
          appId: feishu?.appId ?? current.feishu?.appId ?? '',
          appSecret: feishu?.appSecret && feishu.appSecret !== '***'
            ? feishu.appSecret : current.feishu?.appSecret ?? '',
          redirectUri: feishu?.redirectUri ?? current.feishu?.redirectUri ?? '',
        },
        cos: {
          secretId: cos?.secretId && cos.secretId !== '***'
            ? cos.secretId : current.cos?.secretId ?? '',
          secretKey: cos?.secretKey && cos.secretKey !== '***'
            ? cos.secretKey : current.cos?.secretKey ?? '',
          bucket: cos?.bucket ?? current.cos?.bucket ?? '',
          region: cos?.region ?? current.cos?.region ?? '',
          baseUrl: cos?.baseUrl ?? current.cos?.baseUrl ?? '',
        },
        updatedAt: new Date().toISOString(),
        updatedBy: auth.user.name || auth.user.username || 'admin',
      }

      await env.PODCAST_KV.put(KV_KEY, JSON.stringify(updated))

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