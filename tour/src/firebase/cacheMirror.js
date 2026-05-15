import { saveTripData } from '../tripStorage.js'
import { saveWallet } from '../walletStorage.js'
import { saveSpots } from '../spotsStorage.js'
import { persistPackingState } from '../packingListStorage.js'
import { saveCodeSnapshot } from './tourCodeCache.js'
import { isValidShareCode, normalizeShareCode } from './shareCodeUtils.js'

const COOKIE_PREFIX = 'tour_fb_'
/** 單一 cookie 值需小於約 4KB；中文 JSON 經 encodeURIComponent 會膨脹，保守切片 */
const RAW_CHUNK = 1800
const COOKIE_MAX_AGE_SEC = 180 * 24 * 60 * 60

function clearPayloadCookies() {
  if (typeof document === 'undefined') return
  const n = parseInt(document.cookie.match(new RegExp(`(?:^|; )${COOKIE_PREFIX}n=([^;]*)`))?.[1] || '0', 10)
  for (let i = 0; i < Math.max(n, 48); i++) {
    document.cookie = `${COOKIE_PREFIX}${i}=;path=/;max-age=0;SameSite=Lax`
  }
  document.cookie = `${COOKIE_PREFIX}n=;path=/;max-age=0;SameSite=Lax`
}

function setPayloadCookies(rawJson) {
  clearPayloadCookies()
  let idx = 0
  for (let o = 0; o < rawJson.length; o += RAW_CHUNK) {
    const chunk = rawJson.slice(o, o + RAW_CHUNK)
    document.cookie = `${COOKIE_PREFIX}${idx}=${encodeURIComponent(chunk)};path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`
    idx++
  }
  document.cookie = `${COOKIE_PREFIX}n=${String(idx)};path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`
}

/**
 * 將與 Firebase 同步後的完整快照寫回 localStorage，並以多段 Cookie 備份同一份 JSON。
 * 若資料極大，Cookie 可能達瀏覽器上限而失敗，localStorage 仍為主要來源。
 */
export function mirrorTourDataToBrowserCaches({ tripData, wallet, spots, packing, shareCode }) {
  saveTripData(tripData)
  saveWallet(wallet)
  saveSpots(spots)
  if (packing) persistPackingState(packing)
  const code = normalizeShareCode(shareCode)
  const cacheTarget = code && isValidShareCode(code) ? code : ''
  saveCodeSnapshot(cacheTarget, { tripData, wallet, spots, packing })
  if (typeof document === 'undefined') return
  try {
    const payload = JSON.stringify({ tripData, wallet, spots, packing })
    setPayloadCookies(payload)
  } catch (e) {
    console.warn('[tour] 寫入 Cookie 備份失敗（資料可能過大）', e)
  }
}
