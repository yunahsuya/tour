const WEEKDAY_EN = {
  日: 'SUN',
  一: 'MON',
  二: 'TUE',
  三: 'WED',
  四: 'THU',
  五: 'FRI',
  六: 'SAT',
}

/**
 * @param {string} label e.g. "5/15（四）"
 */
export function parseDayLabel(label) {
  const m = label.match(/^(\d+)\/(\d+)（(.)）/)
  if (!m) {
    return {
      weekShort: '·',
      dayNum: '—',
      monthStr: '',
      weekdayZh: '',
    }
  }
  const month = m[1]
  const day = m[2]
  const zh = m[3]
  return {
    weekShort: WEEKDAY_EN[zh] ?? zh,
    dayNum: day.padStart(2, '0'),
    monthStr: `${month.padStart(2, '0')}月`,
    weekdayZh: zh,
  }
}

/** @returns {string} 本地時區 YYYY-MM-DD */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @param {string} dayId */
export function dateKeyFromDayId(dayId) {
  const m = String(dayId).match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

/**
 * 日期列 strip 索引：0 = 全部，1 起為各天。
 * 今天在行程內則對應該天；早於首日出發日、晚於最後一天則分別停在首尾。
 * @param {{ day: { id: string, label: string } }[]} visiblePairs
 * @param {Date} [refDate]
 */
export function stripIndexForToday(visiblePairs, refDate = new Date()) {
  if (!visiblePairs?.length) return 1

  const today = localDateKey(refDate)
  const matches = []

  for (let i = 0; i < visiblePairs.length; i++) {
    const { day } = visiblePairs[i]
    if (dateKeyFromDayId(day.id) === today) {
      matches.push(i + 1)
      continue
    }
    const lm = day.label.match(/^(\d+)\/(\d+)/)
    if (!lm) continue
    const labelKey = `${refDate.getFullYear()}-${lm[1].padStart(2, '0')}-${lm[2].padStart(2, '0')}`
    if (labelKey === today) matches.push(i + 1)
  }

  if (matches.length) return matches[0]

  const firstKey = dateKeyFromDayId(visiblePairs[0].day.id)
  const lastKey = dateKeyFromDayId(visiblePairs[visiblePairs.length - 1].day.id)
  if (firstKey && today < firstKey) return 1
  if (lastKey && today > lastKey) return visiblePairs.length
  return 1
}
