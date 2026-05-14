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
