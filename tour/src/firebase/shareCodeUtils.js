const CODE_LEN = 8
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** 使用者輸入 → Firestore 文件 id（僅大寫英數，6–16 字） */
export function normalizeShareCode(raw) {
  if (raw == null) return ''
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16)
}

export function isValidShareCode(code) {
  const c = normalizeShareCode(code)
  return c.length >= 6 && c.length <= 16
}

export function formatShareCodeForDisplay(code) {
  const c = normalizeShareCode(code)
  if (c.length <= 4) return c
  return `${c.slice(0, 4)}-${c.slice(4)}`
}

export function generateShareCode() {
  let out = ''
  const rand =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? () => crypto.getRandomValues(new Uint8Array(1))[0]
      : () => Math.floor(Math.random() * 256)
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[rand() % ALPHABET.length]
  }
  return out
}
