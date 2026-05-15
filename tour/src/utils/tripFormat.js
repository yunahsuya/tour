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

/** 與頂部地區篩選 chip 相同文案（不含「全部」） */
export function regionChipLabel(region) {
  if (!region) return ''
  const code = String(region.code ?? '').trim() || String(region.flag ?? '').trim()
  const short = String(region.name ?? '').split('（')[0]?.trim() ?? ''
  return `${code} ${short}`.trim()
}

/** 將既存標籤（例如僅「台灣」）對應到 chip 完整字串 */
export function alignRegionTagToChip(saved, chipLabels) {
  const t = String(saved ?? '').trim()
  if (!t) return ''
  if (chipLabels.includes(t)) return t
  for (const chip of chipLabels) {
    const m = chip.match(/^\S+\s+(.+)$/)
    if (m && m[1] === t) return chip
  }
  return t
}

export function splitTimeForCard(time) {
  if (!time || typeof time !== 'string') return { main: '—', sub: '' }
  const m = time.trim().match(/^(.+?)\s*[–-]\s*(.+)$/)
  if (m) return { main: m[1].trim(), sub: m[2].trim() }
  return { main: time.trim(), sub: '' }
}

/** 行程左欄日期（e.g. "5/15（四）" → "5/15"） */
export function formatDayLabelShort(label, dayId) {
  const fromLabel = String(label ?? '').match(/^(\d{1,2}\/\d{1,2})/)
  if (fromLabel) return fromLabel[1]
  const id = String(dayId ?? '')
  if (/^\d{4}-\d{2}-\d{2}$/.test(id)) {
    const [, mo, d] = id.split('-')
    return `${Number(mo)}/${Number(d)}`
  }
  return String(label ?? '').split('（')[0]?.trim() ?? ''
}

/** 將單側 "H:MM" / "HH:MM" 正規成下拉選單用字串；無法辨識則回傳空 */
function normalizeOneHmPart(part) {
  const t = String(part ?? '').trim()
  if (!t) return { h: '', m: '' }
  const m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return { h: '', m: '' }
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h > 23 || min > 59) return { h: '', m: '' }
  return { h: String(h).padStart(2, '0'), m: String(min).padStart(2, '0') }
}

/** 解析活動時間為 { sh, sm, eh, em }，皆為兩位字串或空（供時間下拉使用） */
export function parseActivityTimeParts(time) {
  const raw = String(time ?? '').trim()
  if (!raw) return { sh: '', sm: '', eh: '', em: '' }
  const sp = splitTimeForCard(raw)
  const a = normalizeOneHmPart(sp.main === '—' ? '' : sp.main)
  const b = normalizeOneHmPart(sp.sub)
  return { sh: a.h, sm: a.m, eh: b.h, em: b.m }
}

const EN_DASH_RANGE = ' – '

/** 由四個欄位組回與資料相同的時間字串（使用 en dash） */
export function buildActivityTimeString(parts) {
  const { sh, sm, eh, em } = parts
  const hasA = sh !== '' && sm !== ''
  const hasB = eh !== '' && em !== ''
  if (!hasA && !hasB) return ''
  const aStr = hasA ? `${sh}:${sm}` : ''
  const bStr = hasB ? `${eh}:${em}` : ''
  if (hasA && hasB) return `${aStr}${EN_DASH_RANGE}${bStr}`
  return aStr || bStr
}

const KEY_STAY_FIRST = -1_000_000
const KEY_UNTIMED_ACTIVITY = 200_000
const KEY_BLOCK_LAST = 400_000

function dayItemSortPrimary(item) {
  if (item.type === 'stay') return KEY_STAY_FIRST
  if (item.type === 'block') return KEY_BLOCK_LAST
  const p = parseActivityTimeParts(item.time ?? '')
  if (p.sh && p.sm) {
    return parseInt(p.sh, 10) * 60 + parseInt(p.sm, 10)
  }
  return KEY_UNTIMED_ACTIVITY
}

/** 同一天內：住宿置頂 → 活動依開始時間（00:00 最先）→ 無時間活動 → 備註區塊置底；同分維持原順序 */
export function sortDayItemsChronologically(items) {
  const indexed = items.map((it, i) => ({ it, i }))
  indexed.sort((a, b) => {
    const ka = dayItemSortPrimary(a.it)
    const kb = dayItemSortPrimary(b.it)
    if (ka !== kb) return ka - kb
    return a.i - b.i
  })
  return indexed.map((x) => x.it)
}

/** 對整份行程每個 day.items 套用時間排序（載入儲存／同步後使用） */
export function normalizeTripItemOrder(trip) {
  return trip.map((region) => ({
    ...region,
    days: region.days.map((day) => ({
      ...day,
      items: sortDayItemsChronologically(day.items),
    })),
  }))
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
  const region = (item.regionTag || regionLabel || '').trim()
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
