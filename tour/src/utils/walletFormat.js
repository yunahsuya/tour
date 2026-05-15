import { FX_LABELS } from '../fxRates.js'

export function formatWalletDateLine(day) {
  if (!day) return ''
  const m = String(day.label).match(/^(\d{1,2}\/\d{1,2})/)
  if (m) return m[1]
  if (day.id && /^\d{4}-\d{2}-\d{2}$/.test(day.id)) {
    const [, mo, d] = day.id.split('-')
    return `${mo}/${d}`
  }
  return day.label ?? ''
}

export function formatWalletEntryDisplay(e) {
  const payer = e.paidBy ? `${e.paidBy}付` : null
  let s = payer ? `${e.note} · ${payer} · NT$ ${e.twd.toLocaleString('zh-TW')}` : `${e.note} · NT$ ${e.twd.toLocaleString('zh-TW')}`
  if (e.foreignCurrency && e.foreignAmount != null) {
    const L = FX_LABELS[e.foreignCurrency]
    const sym = L?.sym ?? ''
    s += `（${e.foreignAmount} ${sym} ${e.foreignCurrency}）`
  }
  return s
}

/** 付款人細項列（累積模式，已依付款人篩選） */
export function formatWalletPayerDetailRow(dayLabel, e) {
  let s = `${dayLabel} · ${e.note} · NT$ ${e.twd.toLocaleString('zh-TW')}`
  if (e.foreignCurrency && e.foreignAmount != null) {
    const L = FX_LABELS[e.foreignCurrency]
    const sym = L?.sym ?? ''
    s += `（${e.foreignAmount} ${sym} ${e.foreignCurrency}）`
  }
  return s
}
