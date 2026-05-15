import { WALLET_PAYERS } from '../constants/appConstants.js'
import { listAllWalletEntries, normalizePayerName, sumAll } from '../walletStorage.js'

function exportStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function csvCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** @param {ReturnType<typeof listAllWalletEntries>} rows */
export function walletRowsToCsv(rows) {
  const header = ['日期', '日期ID', '項目', '台幣金額', '外幣金額', '外幣幣別', '付款人']
  const lines = [
    header.join(','),
    ...rows.map(({ dayLabel, dayId, entry, paidBy }) =>
      [
        csvCell(dayLabel),
        csvCell(dayId),
        csvCell(entry.note),
        csvCell(entry.twd ?? 0),
        csvCell(entry.foreignAmount ?? ''),
        csvCell(entry.foreignCurrency ?? ''),
        csvCell(paidBy),
      ].join(','),
    ),
  ]
  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadWalletCsv(wallet, dayLabelById) {
  const rows = listAllWalletEntries(wallet, dayLabelById)
  if (rows.length === 0) {
    window.alert('尚無記帳紀錄可匯出。')
    return
  }
  const csv = walletRowsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `tour-wallet-${exportStamp()}.csv`)
}

function wrapText(ctx, text, maxWidth) {
  const chars = [...String(text)]
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function drawLines(ctx, lines, x, y, lineHeight) {
  for (const ln of lines) {
    ctx.fillText(ln, x, y)
    y += lineHeight
  }
  return y
}

function drawRow(ctx, left, right, x, y, w, lineHeight) {
  ctx.font = '600 14px "Segoe UI", "Microsoft JhengHei", "PingFang TC", sans-serif'
  ctx.fillStyle = '#3e3229'
  ctx.fillText(left, x, y)
  const rw = ctx.measureText(right).width
  ctx.fillText(right, x + w - rw, y)
  return y + lineHeight
}

/**
 * @param {{
 *   wallet: object,
 *   dayLabelById: Map<string, string>,
 *   walletBreakdown: { label: string, total: number }[],
 *   walletPayerBreakdown: [string, number][],
 * }} opts
 */
export async function downloadWalletPng(opts) {
  const { wallet, dayLabelById, walletBreakdown, walletPayerBreakdown } = opts
  const allRows = listAllWalletEntries(wallet, dayLabelById)
  if (allRows.length === 0) {
    window.alert('尚無記帳紀錄可匯出。')
    return
  }

  const otherPayers = [
    ...new Set(allRows.map((r) => r.paidBy).filter((p) => !WALLET_PAYERS.includes(p))),
  ]

  const pad = 36
  const width = 720
  const contentW = width - pad * 2
  const lineH = 22
  const sectionGap = 18

  let height = pad + 80
  height += walletBreakdown.length * lineH + sectionGap
  height += Math.max(walletPayerBreakdown.length, 1) * lineH + sectionGap
  for (const payer of WALLET_PAYERS) {
    const items = allRows.filter((r) => r.paidBy === normalizePayerName(payer))
    if (!items.length) continue
    height += 28 + items.length * (lineH + 4)
  }
  for (const payer of otherPayers) {
    const items = allRows.filter((r) => r.paidBy === payer)
    height += 28 + items.length * (lineH + 4)
  }
  height += pad + 40

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    window.alert('無法建立圖片，請換用其他瀏覽器再試。')
    return
  }

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#f2e6d2')
  bg.addColorStop(0.45, '#e8dcc4')
  bg.addColorStop(1, '#ebe0d0')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  let y = pad + 8
  const x = pad

  ctx.fillStyle = '#7c6246'
  ctx.font = '700 11px "Segoe UI", "Microsoft JhengHei", sans-serif'
  ctx.fillText('TOUR WALLET', x, y)
  y += 20

  ctx.fillStyle = '#3e3229'
  ctx.font = '700 22px Georgia, "Times New Roman", "Microsoft JhengHei", serif'
  ctx.fillText('旅程記帳報表', x, y)
  y += 28

  ctx.font = '13px "Segoe UI", "Microsoft JhengHei", sans-serif'
  ctx.fillStyle = '#6b5a4a'
  const exportedAt = new Date().toLocaleString('zh-TW', { hour12: false })
  ctx.fillText(`匯出時間：${exportedAt}`, x, y)
  y += 32

  ctx.font = '700 28px Georgia, "Times New Roman", serif'
  ctx.fillStyle = '#3e3229'
  const totalStr = `NT$ ${sumAll(wallet).toLocaleString('zh-TW')}`
  ctx.fillText(totalStr, x, y)
  y += 22
  ctx.font = '12px "Segoe UI", "Microsoft JhengHei", sans-serif'
  ctx.fillStyle = '#6b5a4a'
  ctx.fillText('整趟旅程累積（台幣，外幣已換算）', x, y)
  y += sectionGap + 8

  ctx.strokeStyle = 'rgba(62, 50, 41, 0.2)'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + contentW, y)
  ctx.stroke()
  ctx.setLineDash([])
  y += 16

  ctx.font = '700 12px "Segoe UI", "Microsoft JhengHei", sans-serif'
  ctx.fillStyle = '#6b5a4a'
  ctx.fillText('各日小計', x, y)
  y += 20
  for (const row of walletBreakdown) {
    y = drawRow(
      ctx,
      row.label,
      `NT$ ${row.total.toLocaleString('zh-TW')}`,
      x,
      y,
      contentW,
      lineH,
    )
  }
  y += sectionGap

  ctx.fillStyle = '#6b5a4a'
  ctx.font = '700 12px "Segoe UI", "Microsoft JhengHei", sans-serif'
  ctx.fillText('依付款人', x, y)
  y += 20
  for (const [payer, total] of walletPayerBreakdown) {
    y = drawRow(
      ctx,
      payer,
      `NT$ ${total.toLocaleString('zh-TW')}`,
      x,
      y,
      contentW,
      lineH,
    )
  }
  y += sectionGap

  ctx.fillStyle = '#6b5a4a'
  ctx.font = '700 12px "Segoe UI", "Microsoft JhengHei", sans-serif'
  ctx.fillText('支出細項', x, y)
  y += 22

  function drawPayerSection(payerName, items) {
    const subtotal = items.reduce((s, r) => s + (r.entry.twd || 0), 0)
    ctx.font = '700 15px "Segoe UI", "Microsoft JhengHei", sans-serif'
    ctx.fillStyle = '#3e3229'
    ctx.fillText(`${payerName} · NT$ ${subtotal.toLocaleString('zh-TW')}`, x, y)
    y += 20
    ctx.font = '13px "Segoe UI", "Microsoft JhengHei", sans-serif'
    ctx.fillStyle = '#4a3f36'
    for (const { dayLabel, entry } of items) {
      const foreign =
        entry.foreignCurrency && entry.foreignAmount != null
          ? `（${entry.foreignAmount} ${entry.foreignCurrency}）`
          : ''
      const line = `${dayLabel} · ${entry.note} · NT$ ${(entry.twd || 0).toLocaleString('zh-TW')}${foreign}`
      const wrapped = wrapText(ctx, line, contentW)
      y = drawLines(ctx, wrapped, x, y, lineH)
      y += 4
    }
    y += 8
  }

  for (const payer of WALLET_PAYERS) {
    const items = allRows.filter((r) => r.paidBy === normalizePayerName(payer))
    if (items.length) drawPayerSection(payer, items)
  }
  for (const payer of otherPayers) {
    drawPayerSection(payer, allRows.filter((r) => r.paidBy === payer))
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  downloadBlob(blob, `tour-wallet-${exportStamp()}.png`)
}
