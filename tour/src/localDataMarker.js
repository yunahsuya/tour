/** 本機儲存輔助：Cookie 僅寫入時間戳（體積小），完整資料仍在 localStorage。 */

const COOKIE_NAME = 'tour_local_data_ts'
const COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60

export function touchLocalDataSavedCookie() {
  if (typeof document === 'undefined') return
  try {
    const ts = Date.now()
    document.cookie = `${COOKIE_NAME}=${ts};path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`
  } catch {
    // ignore
  }
}

/** 舊版雲端共用網址參數已廢止，自網址列移除以免誤解。 */
export function stripLegacyShareQueryFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const u = new URL(window.location.href)
    if (!u.searchParams.has('share')) return
    u.searchParams.delete('share')
    const q = u.searchParams.toString()
    window.history.replaceState({}, '', `${u.pathname}${q ? `?${q}` : ''}${u.hash}`)
  } catch {
    // ignore
  }
}
