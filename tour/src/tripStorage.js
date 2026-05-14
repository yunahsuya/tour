import { regions } from './data/trip.js'
import { touchLocalDataSavedCookie } from './localDataMarker.js'
import { normalizeTripItemOrder } from './utils/tripFormat.js'

const STORAGE_KEY = 'tour-itinerary-v1'

function cloneDefault() {
  return structuredClone(regions)
}

export function loadTripData() {
  if (typeof localStorage === 'undefined') return cloneDefault()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefault()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefault()
    return normalizeTripItemOrder(parsed)
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
