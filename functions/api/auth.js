// EdgeOne Pages Node Function - 认证（飞书 OAuth + 本地管理员）
// 路由: /api/auth/*

import crypto from 'crypto'

const FEISHU_AUTHORIZE_URL = 'https://open.feishu.cn/open-apis/authen/v1/index'
const FEISHU_TOKEN_URL = 'https://open.feishu.cn/open-apis/authen/v1/access_token'
const FEISHU_USER_INFO_URL = 'https://open.feishu.cn/open-apis/authen/v1/user_info'

function generateState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function createSession(env, user) {
  const sessionId = generateState()
  const session = {
    ...user,
    loginAt: new Date().toISOString(),
  }
  // 存储到 KV，有效期 24 小时
  env.PODCAST_KV.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 86400,
  })
  return sessionId
}

function getCookieHeaders(sessionId) {
  return {
    'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  }
}

function parseCookies(request) {
  const cookieHeader = request.headers.get('Cookie') || ''
  const cookies = {}
  cookieHeader.split(';').forEach((c) => {
    const [key, ...val] = c.trim().split('=')
    if (key) cookies[key] = val.join('=')
  })
  return cookies
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

  // /api/auth/login - 发起飞书 OAuth 登录
  if (path === '/api/auth/login' && request.method === 'GET') {
    // 从环境变量或 KV 配置获取飞书 App ID
    let appId = env.FEISHU_APP_ID
    let appSecret = env.FEISHU_APP_SECRET
    let redirectUri = env.FEISHU_REDIRECT_URI

    if (!appId) {
      const sysConfig = await env.PODCAST_KV.get('system:config', 'json')
      if (sysConfig?.feishu?.appId) {
        appId = sysConfig.feishu.appId
        appSecret = sysConfig.feishu.appSecret
        redirectUri = sysConfig.feishu.redirectUri
      }
    }

    if (!appId) {
      // 开发模式: 没有配置飞书 App 时使用模拟登录
      const redirectUrl = url.searchParams.get('redirect') || '/'
      // 直接返回一个页面，让用户输入名字模拟登录
      return new Response(
        `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>登录</title></head>
<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f5f7fa">
  <div style="background:#fff;padding:40px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.1);text-align:center;width:360px">
    <h2 style="margin-bottom:8px">播客管理后台</h2>
    <p style="color:#909399;margin-bottom:24px;font-size:14px">飞书应用未配置，使用开发模式</p>
    <form action="/api/auth/callback" method="GET">
      <input type="hidden" name="state" value="dev">
      <input type="hidden" name="redirect" value="${redirectUrl}">
      <input name="name" placeholder="输入用户名（开发模式）" required
        style="width:100%;padding:10px 12px;border:1px solid #dcdfe6;border-radius:6px;margin-bottom:16px;font-size:14px;box-sizing:border-box">
      <button type="submit"
        style="width:100%;padding:10px;background:#409eff;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">
        登录
      </button>
    </form>
  </div>
</body></html>`,
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        }
      )
    }

    // 正式飞书 OAuth 流程
    const state = generateState()
    const callbackUri = redirectUri || `${url.origin}/api/auth/callback`
    const authUrl = `${FEISHU_AUTHORIZE_URL}?redirect_uri=${encodeURIComponent(callbackUri)}&app_id=${appId}&state=${state}`

    // 存储 state 用于后续验证
    await env.PODCAST_KV.put(`oauth_state:${state}`, '1', { expirationTtl: 600 })

    return Response.redirect(authUrl, 302)
  }

  // /api/auth/callback - 飞书 OAuth 回调
  if (path === '/api/auth/callback' && request.method === 'GET') {
    const { code, state, name } = Object.fromEntries(url.searchParams)

    const redirectParam = url.searchParams.get('redirect') || '/'

    // 开发模式处理
    if (state === 'dev' && name) {
      const user = {
        name: name,
        avatar_url: '',
        open_id: `dev_${Date.now()}`,
        union_id: `dev_${Date.now()}`,
      }
      const sessionId = createSession(env, user)
      return Response.redirect(`${url.origin}${redirectParam}`, 302, {
        headers: getCookieHeaders(sessionId),
      })
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    try {
      // 获取飞书配置（用于 code 换 token）
      let appId = env.FEISHU_APP_ID
      let appSecret = env.FEISHU_APP_SECRET
      if (!appId) {
        const sysConfig = await env.PODCAST_KV.get('system:config', 'json')
        if (sysConfig?.feishu?.appId) {
          appId = sysConfig.feishu.appId
          appSecret = sysConfig.feishu.appSecret
        }
      }

      // 1. 用 code 换 access_token
      const tokenRes = await fetch(FEISHU_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
          code,
        }),
      })
      const tokenData = await tokenRes.json()

      if (!tokenData.access_token) {
        return new Response(JSON.stringify({ error: 'Failed to get access token', detail: tokenData }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 2. 获取用户信息
      const userRes = await fetch(FEISHU_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userData = await userRes.json()

      if (!userData.name) {
        return new Response(JSON.stringify({ error: 'Failed to get user info', detail: userData }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const user = {
        name: userData.name,
        avatar_url: userData.avatar_url || '',
        open_id: userData.open_id,
        union_id: userData.union_id,
      }

      const sessionId = createSession(env, user)
      return Response.redirect(`${url.origin}${redirectParam}`, 302, {
        headers: getCookieHeaders(sessionId),
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  // /api/auth/me - 获取当前登录用户信息
  if (path === '/api/auth/me' && request.method === 'GET') {
    const cookies = parseCookies(request)
    const sessionId = cookies.session_id

    if (!sessionId) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const session = await env.PODCAST_KV.get(`session:${sessionId}`, 'json')
    if (!session) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ user: session }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // /api/auth/admin-login - 本地管理员登录
  if (path === '/api/auth/admin-login' && request.method === 'POST') {
    try {
      const body = await request.json()
      const { username, password } = body

      if (!username || !password) {
        return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 获取管理员账号
      const admin = await env.PODCAST_KV.get('system:admin', 'json')
      if (!admin) {
        return new Response(JSON.stringify({ error: '管理员账号未初始化' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 验证密码
      const hash = crypto.pbkdf2Sync(password, admin.salt, 10000, 64, 'sha512').toString('hex')
      if (hash !== admin.passwordHash || username !== admin.username) {
        return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 创建会话
      const user = {
        name: admin.username,
        role: admin.role,
        loginType: 'admin',
        avatar_url: '',
      }
      const sessionId = createSession(env, user)

      return new Response(JSON.stringify({ user }), {
        headers: {
          'Content-Type': 'application/json',
          ...getCookieHeaders(sessionId),
          ...corsHeaders,
        },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  // /api/auth/logout - 登出
  if (path === '/api/auth/logout' && request.method === 'POST') {
    const cookies = parseCookies(request)
    const sessionId = cookies.session_id

    if (sessionId) {
      await env.PODCAST_KV.delete(`session:${sessionId}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        ...corsHeaders,
      },
    })
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}