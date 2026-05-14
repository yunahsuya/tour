import { googleMapsSearchUrl } from '../mapUtils.js'

export function normalizeUserMapUrl(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  if (/^javascript:/i.test(t)) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

export function mapUrlFromTripItem(item) {
  if (item.mapUrl && String(item.mapUrl).trim()) return String(item.mapUrl).trim()
  const leg = item.links?.find((l) => l.label === '地圖連結' || l.label === '地圖')
  return leg?.href?.trim() ?? ''
}

export function mapHrefForTripItem(item) {
  const raw = mapUrlFromTripItem(item)
  if (raw) return normalizeUserMapUrl(raw)
  return googleMapsSearchUrl(item.title)
}

export function splitTimeForCard(time) {
  if (!time || typeof time !== 'string') return { main: '—', sub: '' }
  const m = time.trim().match(/^(.+?)\s*[–-]\s*(.+)$/)
  if (m) return { main: m[1].trim(), sub: m[2].trim() }
  return { main: time.trim(), sub: '' }
}

function parseHmToMinutes(str) {
  const m = String(str).trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function formatDurationFromTimeRange(time) {
  if (!time || typeof time !== 'string') return ''
  const parts = time.trim().split(/\s*[–-]\s*/)
  if (parts.length < 2) return ''
  const start = parseHmToMinutes(parts[0])
  const end = parseHmToMinutes(parts[1])
  if (start == null || end == null) return ''
  let diff = end - start
  if (diff <= 0) diff += 24 * 60
  if (diff < 60) return `${diff} 分鐘`
  const hrs = diff / 60
  if (Number.isInteger(hrs)) return `${hrs} 小時`
  return `${Math.round(hrs * 10) / 10} 小時`
}

export function simplePreviewTimeLabel(item) {
  if (item.type === 'activity' && item.time) return splitTimeForCard(item.time).main
  return '—'
}

export function simplePreviewMetaLine(item, regionLabel) {
  const region = (regionLabel || '').trim()
  const bits = []
  if (region) bits.push(region)
  if (item.type === 'stay') {
    const d = (item.detail ?? '').trim()
    if (d && d !== '住宿') bits.push(d.split(/[;\n]/)[0].trim().slice(0, 36))
    else bits.push('住宿')
  } else if (item.type === 'block') {
    const d = (item.detail ?? '').trim()
    bits.push(d ? d.slice(0, 40) : '備註')
  } else {
    const dur = formatDurationFromTimeRange(item.time ?? '')
    const d = (item.detail ?? '').trim()
    if (dur) bits.push(dur)
    else if (d) bits.push(d.slice(0, 36))
  }
  return bits.join(' · ')
}
