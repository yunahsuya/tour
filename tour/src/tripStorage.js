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

/** 合併缺漏地區、排序項目；有補齊時寫回本機 */
export function prepareTripData(raw) {
  const { trip, changed } = mergeTripWithDefaults(raw)
  const ordered = normalizeTripItemOrder(trip)
  if (changed) saveTripData(ordered)
  return ordered
}

export function loadTripData() {
  if (typeof localStorage === 'undefined') return cloneDefault()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefault()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefault()
    return prepareTripData(parsed)
  } catch {
    return cloneDefault()
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
