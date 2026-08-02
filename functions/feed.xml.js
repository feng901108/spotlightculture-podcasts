// EdgeOne Pages Node Function - Apple Podcasts RSS Feed 生成
// 路由: /feed.xml
//
// 生成符合 Apple Podcasts 规范的 RSS 2.0 Feed
// 参考: https://podcasters.apple.com/support/823-podcast-requirements

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRFC2822(dateStr) {
  if (!dateStr) return new Date().toUTCString()
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return new Date().toUTCString()
  return d.toUTCString()
}

function getContentType(fileUrl) {
  if (!fileUrl) return 'audio/mpeg'
  const ext = fileUrl.split('.').pop().toLowerCase()
  const mimeMap = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    m4v: 'video/mp4',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    wav: 'audio/wav',
    aac: 'audio/aac',
    wma: 'audio/x-ms-wma',
    ogg: 'audio/ogg',
  }
  return mimeMap[ext] || 'audio/mpeg'
}

function generateFeedXml(settings, episodes) {
  const {
    title = 'Untitled Podcast',
    author = 'Unknown',
    description = '',
    language = 'zh-cn',
    category = '',
    subcategory = '',
    image = '',
    explicit = 'false',
    link = '',
    ownerName = '',
    ownerEmail = '',
    copyright = '',
  } = settings

  const feedUrl = typeof window !== 'undefined' ? `${window.location.origin}/feed.xml` : '/feed.xml'

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(link || feedUrl)}</link>
    <language>${escapeXml(language)}</language>
    <lastBuildDate>${formatRFC2822(new Date())}</lastBuildDate>
    <itunes:author>${escapeXml(author)}</itunes:author>
    <itunes:summary>${escapeXml(description)}</itunes:summary>
    <itunes:explicit>${explicit === 'true' ? 'true' : 'false'}</itunes:explicit>`

  // 分类
  if (category) {
    xml += `\n    <itunes:category text="${escapeXml(category)}">`
    if (subcategory) {
      xml += `\n      <itunes:category text="${escapeXml(subcategory)}"/>`
    }
    xml += `\n    </itunes:category>`
  }

  // 封面图
  if (image) {
    xml += `\n    <itunes:image href="${escapeXml(image)}"/>`
  }

  // 所有者
  if (ownerName || ownerEmail) {
    xml += `\n    <itunes:owner>`
    if (ownerName) xml += `\n      <itunes:name>${escapeXml(ownerName)}</itunes:name>`
    if (ownerEmail) xml += `\n      <itunes:email>${escapeXml(ownerEmail)}</itunes:email>`
    xml += `\n    </itunes:owner>`
  }

  // 版权
  if (copyright) {
    xml += `\n    <copyright>${escapeXml(copyright)}</copyright>`
  }

  // 节目列表
  const sortedEpisodes = Array.isArray(episodes)
    ? [...episodes].sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
    : []

  for (const ep of sortedEpisodes) {
    const guid = ep.id || ep.guid || `episode-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const pubDate = formatRFC2822(ep.pubDate)
    const duration = ep.duration || '0'
    const epType = ep.episodeType || 'full'
    const explicit = ep.explicit === 'true' ? 'yes' : 'no'

    xml += `\n    <item>
      <title>${escapeXml(ep.title || 'Untitled')}</title>
      <description>${escapeXml(ep.description || '')}</description>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <itunes:duration>${escapeXml(String(duration))}</itunes:duration>
      <itunes:explicit>${explicit}</itunes:explicit>
      <itunes:episodeType>${escapeXml(epType)}</itunes:episodeType>`

    if (ep.season) {
      xml += `\n      <itunes:season>${escapeXml(String(ep.season))}</itunes:season>`
    }
    if (ep.episode) {
      xml += `\n      <itunes:episode>${escapeXml(String(ep.episode))}</itunes:episode>`
    }

    // 文件附件
    if (ep.fileUrl) {
      const contentType = getContentType(ep.fileUrl)
      const fileSize = ep.fileSize || 0
      xml += `\n      <enclosure url="${escapeXml(ep.fileUrl)}" length="${escapeXml(String(fileSize))}" type="${escapeXml(contentType)}"/>`
    }

    xml += `\n    </item>`
  }

  xml += `\n  </channel>
</rss>`

  return xml
}

export async function onRequest(context) {
  const { env } = context

  try {
    // 获取播客设置
    const settings = await env.PODCAST_KV.get('podcast_settings', 'json')

    // 获取节目列表
    let episodes = await env.PODCAST_KV.get('episodes', 'json')
    episodes = Array.isArray(episodes) ? episodes : []

    const xml = generateFeedXml(settings || {}, episodes)

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>Podcast Feed Error</title>
    <description>Error generating feed: ${escapeXml(e.message)}</description>
  </channel>
</rss>`, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  }
}