import { normalizeShareCode } from './shareCodeUtils.js'

const STORAGE_KEY = 'tour-share-code-v1'

export function loadShareCode() {
  if (typeof localStorage === 'undefined') return ''
  try {
    return normalizeShareCode(localStorage.getItem(STORAGE_KEY) || '')
  } catch {
    return ''
  }
}

export function saveShareCode(code) {
  if (typeof localStorage === 'undefined') return
  const normalized = normalizeShareCode(code)
  try {
    if (normalized) localStorage.setItem(STORAGE_KEY, normalized)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function clearShareCode() {
  saveShareCode('')
}
