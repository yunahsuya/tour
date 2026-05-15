export function googleMapsSearchUrl(query) {
  const q = (query ?? '').trim() || 'London'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** @param {string | undefined} regionId */
export function osmEmbedUrl(regionId) {
  if (regionId === 'taiwan') {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=121.1%2C24.92%2C121.65%2C25.12&layer=mapnik'
  }
  if (regionId === 'barcelona') {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=2.05%2C41.35%2C2.23%2C41.45&layer=mapnik'
  }
  if (regionId === 'london') {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=-0.18%2C51.47%2C0.06%2C51.54&layer=mapnik'
  }
  return 'https://www.openstreetmap.org/export/embed.html?bbox=-0.12%2C41.36%2C2.2%2C51.55&layer=mapnik'
}

function isFiniteLatLng(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
}

/**
 * 以座標為中心縮小 bbox，並加上 marker（與 openstreetmap.org 分享嵌入相同格式）。
 * @param {number} lat
 * @param {number} lon
 */
export function osmEmbedUrlAroundPoint(lat, lon) {
  const padLon = 0.022
  const padLat = 0.018
  const minlon = lon - padLon
  const maxlon = lon + padLon
  const minlat = lat - padLat
  const maxlat = lat + padLat
  const bbox = `${minlon},${minlat},${maxlon},${maxlat}`
  const marker = `${lat},${lon}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`
}

/**
 * 從常見 Google Maps／搜尋網址嘗試解析經緯度；失敗則回傳 null（改以地理編碼）。
 * @param {string} href
 * @returns {{ lat: number, lon: number } | null}
 */
export function tryParseLatLonFromMapHref(href) {
  const raw = String(href ?? '').trim()
  if (!raw || /^javascript:/i.test(raw)) return null

  let u
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const pathSearchHash = `${u.pathname}${u.search}${u.hash}`

  const at = pathSearchHash.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:\b|,|;|\)|\/|$)/)
  if (at) {
    const lat = parseFloat(at[1])
    const lon = parseFloat(at[2])
    if (isFiniteLatLng(lat, lon)) return { lat, lon }
  }

  const d34 = pathSearchHash.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  if (d34) {
    const lat = parseFloat(d34[1])
    const lon = parseFloat(d34[2])
    if (isFiniteLatLng(lat, lon)) return { lat, lon }
  }

  const ll = u.searchParams.get('ll')
  if (ll) {
    const m = ll.trim().match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/)
    if (m) {
      const lat = parseFloat(m[1])
      const lon = parseFloat(m[2])
      if (isFiniteLatLng(lat, lon)) return { lat, lon }
    }
  }

  const center = u.searchParams.get('center')
  if (center) {
    const m = center.trim().match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/)
    if (m) {
      const lat = parseFloat(m[1])
      const lon = parseFloat(m[2])
      if (isFiniteLatLng(lat, lon)) return { lat, lon }
    }
  }

  for (const key of ['query', 'q']) {
    const v = u.searchParams.get(key)
    if (!v) continue
    let decoded = v
    try {
      decoded = decodeURIComponent(v.replace(/\+/g, ' '))
    } catch {
      decoded = v.replace(/\+/g, ' ')
    }
    const coord = decoded.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/)
    if (coord) {
      const lat = parseFloat(coord[1])
      const lon = parseFloat(coord[2])
      if (isFiniteLatLng(lat, lon)) return { lat, lon }
    }
  }

  return null
}

/** @param {string} href @param {string} titleFallback */
function geocodeQueryFromHref(href, titleFallback) {
  const raw = String(href ?? '').trim()
  if (!raw) return String(titleFallback ?? '').trim()

  let u
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return String(titleFallback ?? '').trim()
  }

  const host = u.hostname.toLowerCase()
  const onGoogleMapsPath = u.pathname.includes('/maps')
  if (host === 'maps.google.com' || onGoogleMapsPath) {
    for (const key of ['query', 'q']) {
      const v = u.searchParams.get(key)
      if (!v) continue
      try {
        const decoded = decodeURIComponent(v.replace(/\+/g, ' ')).trim()
        if (decoded && !/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/.test(decoded)) return decoded
      } catch {
        const t = v.replace(/\+/g, ' ').trim()
        if (t) return t
      }
    }
  }

  return String(titleFallback ?? '').trim()
}

/**
 * 以 Nominatim 將字串轉成座標（需網路；請遵守使用頻率）。
 * @param {string} q
 * @param {AbortSignal} [signal]
 */
export async function nominatimSearchLatLon(q, signal) {
  const trimmed = String(q ?? '').trim()
  if (!trimmed) return null

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    limit: '1',
  })

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.7',
    },
  })

  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || !data[0]) return null

  const lat = parseFloat(data[0].lat)
  const lon = parseFloat(data[0].lon)
  if (!isFiniteLatLng(lat, lon)) return null
  return { lat, lon }
}

/**
 * 解析網址內座標，否則用標題／Google query 做地理編碼。
 * @param {string} href
 * @param {string} titleFallback
 * @param {AbortSignal} [signal]
 */
export async function resolveLatLonForMapPreview(href, titleFallback, signal) {
  const fromUrl = tryParseLatLonFromMapHref(href)
  if (fromUrl) return fromUrl

  const q = geocodeQueryFromHref(href, titleFallback)
  if (!q) return null
  return nominatimSearchLatLon(q, signal)
}
