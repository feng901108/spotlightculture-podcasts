// 认证中间件 - 用于保护管理后台 API

function parseCookies(request) {
  const cookieHeader = request.headers.get('Cookie') || ''
  const cookies = {}
  cookieHeader.split(';').forEach((c) => {
    const [key, ...val] = c.trim().split('=')
    if (key) cookies[key] = val.join('=')
  })
  return cookies
}

export async function requireAuth(request, env) {
  const cookies = parseCookies(request)
  const sessionId = cookies.session_id

  if (!sessionId) {
    return { authenticated: false }
  }

  const session = await env.PODCAST_KV.get(`session:${sessionId}`, 'json')
  if (!session) {
    return { authenticated: false }
  }

  return { authenticated: true, user: session }
}
