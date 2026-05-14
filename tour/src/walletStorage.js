const KEY = 'tour-wallet-v1'

/** 內建項目選項（順序固定在最前） */
export const DEFAULT_WALLET_ITEM_LABELS = ['早餐', '午餐', '晚餐']

export function normalizeWallet(data) {
  const byDay = data?.byDay && typeof data.byDay === 'object' ? { ...data.byDay } : {}
  const seen = new Set()
  const ordered = []
  for (const d of DEFAULT_WALLET_ITEM_LABELS) {
    seen.add(d)
    ordered.push(d)
  }
  const rest = Array.isArray(data?.itemLabels) ? data.itemLabels : []
  for (const x of rest) {
    const t = String(x).trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    ordered.push(t)
  }
  return { ...data, byDay, itemLabels: ordered }
}

function defaultWallet() {
  return normalizeWallet({ byDay: {} })
}

export function loadWallet() {
  if (typeof localStorage === 'undefined') return defaultWallet()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultWallet()
    const p = JSON.parse(raw)
    if (!p || typeof p.byDay !== 'object') return defaultWallet()
    return normalizeWallet(p)
  } catch {
    return defaultWallet()
  }
}

export function saveWallet(data) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeWallet(data)))
  } catch {
    // ignore
  }
}

/** 若為新字串則加入項目選單（不重複） */
export function addWalletItemLabel(data, label) {
  const t = String(label).trim()
  if (!t) return normalizeWallet(data)
  const base = normalizeWallet(data)
  if (base.itemLabels.includes(t)) return base
  return { ...base, itemLabels: [...base.itemLabels, t] }
}

/** 從選單移除自訂項目（內建 早餐／午餐／晚餐 不可刪）；已記帳的 note 不會改寫 */
export function removeWalletItemLabel(data, label) {
  const t = String(label).trim()
  if (!t || DEFAULT_WALLET_ITEM_LABELS.includes(t)) return normalizeWallet(data)
  const base = normalizeWallet(data)
  const nextLabels = base.itemLabels.filter((x) => x !== t)
  return normalizeWallet({ ...base, itemLabels: nextLabels })
}

export function addWalletEntry(data, dayId, { note, twd, foreignAmount, foreignCurrency, paidBy }) {
  const base = normalizeWallet(data)
  const next = { ...base, byDay: { ...base.byDay } }
  const list = [...(next.byDay[dayId] ?? [])]
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `w-${Date.now()}`
  const twdNum = Math.round(Number(twd)) || 0
  const entry = {
    id,
    note: note.trim() || '未命名',
    twd: twdNum,
  }
  if (paidBy && String(paidBy).trim()) {
    entry.paidBy = String(paidBy).trim()
  }
  if (
    foreignCurrency &&
    foreignCurrency !== 'TWD' &&
    foreignAmount != null &&
    Number.isFinite(Number(foreignAmount))
  ) {
    entry.foreignAmount = Number(foreignAmount)
    entry.foreignCurrency = foreignCurrency
  }
  list.push(entry)
  next.byDay[dayId] = list
  return next
}

export function removeWalletEntry(data, dayId, entryId) {
  const base = normalizeWallet(data)
  const next = { ...base, byDay: { ...base.byDay } }
  const list = (next.byDay[dayId] ?? []).filter((e) => e.id !== entryId)
  if (list.length) next.byDay[dayId] = list
  else delete next.byDay[dayId]
  return next
}

export function sumDay(data, dayId) {
  const w = normalizeWallet(data)
  return (w.byDay[dayId] ?? []).reduce((s, e) => s + (e.twd || 0), 0)
}

export function sumAll(data) {
  const w = normalizeWallet(data)
  return Object.values(w.byDay)
    .flat()
    .reduce((s, e) => s + (e.twd || 0), 0)
}

/** 累積：各付款人台幣加總（外幣已換算為 twd）。無 paidBy 計入「未指定付款人」。 */
export function sumAllByPayer(data) {
  const w = normalizeWallet(data)
  const map = new Map()
  for (const list of Object.values(w.byDay)) {
    if (!Array.isArray(list)) continue
    for (const e of list) {
      const key =
        e.paidBy && String(e.paidBy).trim() ? String(e.paidBy).trim() : '未指定付款人'
      map.set(key, (map.get(key) || 0) + (Number(e.twd) || 0))
    }
  }
  return [...map.entries()]
    .filter(([, sum]) => sum !== 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'))
}
