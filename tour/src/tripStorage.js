import { regions } from './data/trip.js'
import { touchLocalDataSavedCookie } from './localDataMarker.js'
import { normalizeTripItemOrder } from './utils/tripFormat.js'

const STORAGE_KEY = 'tour-itinerary-v1'

function cloneDefault() {
  return structuredClone(regions)
}

/** 將本機／雲端舊行程補上預設裡新增的地區（例如台灣），保留既有編輯 */
export function mergeTripWithDefaults(trip) {
  if (!Array.isArray(trip) || trip.length === 0) {
    return { trip: cloneDefault(), changed: true }
  }
  const savedById = new Map(trip.map((r) => [r.id, r]))
  const defaultIds = new Set(regions.map((r) => r.id))
  let changed = false
  const merged = regions.map((def) => {
    const existing = savedById.get(def.id)
    if (existing) return existing
    changed = true
    return structuredClone(def)
  })
  for (const r of trip) {
    if (!defaultIds.has(r.id)) merged.push(r)
  }
  return { trip: merged, changed }
}

/**
 * 合併相同日期 label 的重複天（例如舊雲端倫敦 5/15 與台灣 5/15 各一筆）
 * @returns {{ trip: typeof regions, changed: boolean, dayIdRemap: Map<string, string> }}
 */
export function collapseDuplicateDayLabels(trip) {
  const labelToKeeper = new Map()
  const dayIdRemap = new Map()
  let changed = false
  const result = trip.map((region) => {
    const kept = []
    for (const day of region.days) {
      const keeper = labelToKeeper.get(day.label)
      if (keeper) {
        keeper.day.items = [...keeper.day.items, ...day.items]
        dayIdRemap.set(day.id, keeper.day.id)
        changed = true
        continue
      }
      labelToKeeper.set(day.label, { day })
      kept.push(day)
    }
    return { ...region, days: kept }
  })
  return { trip: result, changed, dayIdRemap }
}

/** 合併缺漏地區、去重日期、排序項目；有變更時寫回本機 */
export function prepareTripData(raw) {
  const { trip: merged, changed: mergeChanged } = mergeTripWithDefaults(raw)
  const {
    trip: deduped,
    changed: dedupeChanged,
    dayIdRemap,
  } = collapseDuplicateDayLabels(merged)
  const ordered = normalizeTripItemOrder(deduped)
  if (mergeChanged || dedupeChanged) saveTripData(ordered)
  return { trip: ordered, dayIdRemap }
}

export function loadTripData() {
  return loadTripDataWithMeta().trip
}

/** 載入行程並回傳合併重複日期時的 dayId 對照（供記帳遷移） */
export function loadTripDataWithMeta() {
  if (typeof localStorage === 'undefined') {
    return { trip: cloneDefault(), dayIdRemap: new Map() }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { trip: cloneDefault(), dayIdRemap: new Map() }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { trip: cloneDefault(), dayIdRemap: new Map() }
    }
    return prepareTripData(parsed)
  } catch {
    return { trip: cloneDefault(), dayIdRemap: new Map() }
  }
}

export function saveTripData(data) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    touchLocalDataSavedCookie()
  } catch {
    // quota or private mode
  }
}

export function clearTripStorage() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
