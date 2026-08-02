// EdgeOne Pages Node Function - 系统初始化 API
// 路由: /api/setup/*
// 无需登录，用于首次初始化

import crypto from 'crypto'

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const path = url.pathname

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // /api/setup/status - 检查系统是否已初始化
  if (path === '/api/setup/status' && request.method === 'GET') {
    const initialized = await env.PODCAST_KV.get('system:initialized')
    return new Response(JSON.stringify({
      initialized: initialized === 'true',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // /api/setup/init - 初始化系统（创建管理员 + 保存配置）
  if (path === '/api/setup/init' && request.method === 'POST') {
    // 检查是否已初始化
    const alreadyInit = await env.PODCAST_KV.get('system:initialized')
    if (alreadyInit === 'true') {
      return new Response(JSON.stringify({ error: '系统已初始化' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    try {
      const body = await request.json()
      const { username, password, feishu, cos } = body

      if (!username || !password) {
        return new Response(JSON.stringify({ error: '管理员用户名和密码不能为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (password.length < 6) {
        return new Response(JSON.stringify({ error: '密码长度不能少于6位' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 创建管理员账号
      const salt = crypto.randomBytes(16).toString('hex')
      const passwordHash = hashPassword(password, salt)
      const admin = {
        username,
        passwordHash,
        salt,
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      }

      // 保存系统配置
      const systemConfig = {
        feishu: feishu || {
          appId: '',
          appSecret: '',
          redirectUri: '',
        },
        cos: cos || {
          secretId: '',
          secretKey: '',
          bucket: '',
          region: '',
          baseUrl: '',
        },
        updatedAt: new Date().toISOString(),
      }

      await Promise.all([
        env.PODCAST_KV.put('system:admin', JSON.stringify(admin)),
        env.PODCAST_KV.put('system:config', JSON.stringify(systemConfig)),
        env.PODCAST_KV.put('system:initialized', 'true'),
      ])

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}