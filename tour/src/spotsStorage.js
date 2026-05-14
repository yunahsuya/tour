const KEY = 'tour-spots-v1'

function defaultSpots() {
  return { spots: [] }
}

export function loadSpots() {
  if (typeof localStorage === 'undefined') return defaultSpots()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSpots()
    const p = JSON.parse(raw)
    if (!p || !Array.isArray(p.spots)) return defaultSpots()
    return p
  } catch {
    return defaultSpots()
  }
}

export function saveSpots(data) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function addSpot(data, { title, note, mapUrl }) {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `s-${Date.now()}`
  const mapTrim = mapUrl != null ? String(mapUrl).trim() : ''
  const entry = {
    id,
    title: title.trim() || '未命名景點',
    note: (note ?? '').trim(),
    createdAt: Date.now(),
  }
  if (mapTrim) entry.mapUrl = mapTrim
  return {
    spots: [...data.spots, entry],
  }
}

export function removeSpot(data, id) {
  return { spots: data.spots.filter((s) => s.id !== id) }
}

export function updateSpot(data, id, { title, note, mapUrl }) {
  return {
    spots: data.spots.map((s) => {
      if (s.id !== id) return s
      const next = { ...s }
      if (title != null) next.title = String(title).trim() || '未命名景點'
      if (note != null) next.note = String(note).trim()
      if (mapUrl !== undefined) {
        const m = String(mapUrl).trim()
        if (m) next.mapUrl = m
        else delete next.mapUrl
      }
      return next
    }),
  }
}
