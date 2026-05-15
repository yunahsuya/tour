import { touchLocalDataSavedCookie } from './localDataMarker.js'

const KEY = 'tour-drive-links-v1'

function defaultDriveLinks() {
  return { links: [] }
}

export function newDriveLinkId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `drive-${crypto.randomUUID()}`
  }
  return `drive-${Date.now()}`
}

export function normalizeDriveLinks(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.links)) {
    return defaultDriveLinks()
  }
  const links = data.links
    .filter((x) => x && typeof x.id === 'string' && typeof x.label === 'string' && typeof x.href === 'string')
    .map((x) => {
      const label = x.label.trim().slice(0, 120)
      const href = x.href.trim().slice(0, 2000)
      if (!label || !href) return null
      const from =
        typeof x.from === 'string' && x.from.trim()
          ? x.from.trim().slice(0, 80)
          : 'Google Drive'
      return { id: x.id.trim(), label, href, from }
    })
    .filter(Boolean)
  return { links }
}

export function loadCustomDriveLinks() {
  if (typeof localStorage === 'undefined') return defaultDriveLinks()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultDriveLinks()
    return normalizeDriveLinks(JSON.parse(raw))
  } catch {
    return defaultDriveLinks()
  }
}

export function saveCustomDriveLinks(data) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeDriveLinks(data)))
    touchLocalDataSavedCookie()
  } catch {
    // ignore
  }
}

export function addCustomDriveLink(data, { label, href, from }) {
  const entry = {
    id: newDriveLinkId(),
    label: String(label).trim().slice(0, 120) || '未命名連結',
    href: String(href).trim().slice(0, 2000),
    from:
      from != null && String(from).trim()
        ? String(from).trim().slice(0, 80)
        : 'Google Drive',
  }
  if (!entry.href) return data
  return { links: [...normalizeDriveLinks(data).links, entry] }
}

export function updateCustomDriveLink(data, id, { label, href, from }) {
  return {
    links: normalizeDriveLinks(data).links.map((link) => {
      if (link.id !== id) return link
      const next = { ...link }
      if (label != null) next.label = String(label).trim().slice(0, 120) || link.label
      if (href != null) {
        const h = String(href).trim().slice(0, 2000)
        if (h) next.href = h
      }
      if (from !== undefined) {
        next.from =
          from != null && String(from).trim()
            ? String(from).trim().slice(0, 80)
            : 'Google Drive'
      }
      return next
    }),
  }
}

export function removeCustomDriveLink(data, id) {
  return { links: normalizeDriveLinks(data).links.filter((link) => link.id !== id) }
}
