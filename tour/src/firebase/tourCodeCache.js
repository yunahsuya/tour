import { loadTripData, loadTripDataWithMeta, prepareTripData } from '../tripStorage.js'
import { loadWallet, normalizeWallet, remapWalletDayIds, saveWallet } from '../walletStorage.js'
import { loadSpots } from '../spotsStorage.js'
import { loadPackingState, packingStateFromJson, packingStateToJson } from '../packingListStorage.js'
import { loadCustomDriveLinks, normalizeDriveLinks } from '../driveLinksStorage.js'
import { loadShareCode } from './shareCodeStorage.js'
import { isValidShareCode, normalizeShareCode } from './shareCodeUtils.js'

const SNAPSHOT_PREFIX = 'tour-code-snapshot-v1:'
const LOCAL_WRITE_TS_PREFIX = 'tour-local-write-ts:'
const SYNC_SEEDED_PREFIX = 'tour-sync-seeded:'

/** 未加入共用代碼時的本機專用槽位 */
export const LOCAL_ONLY_SLOT = '__local__'

function slotKey(code) {
  const c = normalizeShareCode(code)
  return c && isValidShareCode(c) ? c : LOCAL_ONLY_SLOT
}

function snapshotStorageKey(code) {
  return `${SNAPSHOT_PREFIX}${slotKey(code)}`
}

export function getCodeLocalWriteTs(code) {
  if (typeof localStorage === 'undefined') return 0
  try {
    return Number(localStorage.getItem(`${LOCAL_WRITE_TS_PREFIX}${slotKey(code)}`) || 0)
  } catch {
    return 0
  }
}

export function setCodeLocalWriteTs(code, ms) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${LOCAL_WRITE_TS_PREFIX}${slotKey(code)}`, String(ms || Date.now()))
  } catch {
    // ignore
  }
}

export function isCodeSyncSeeded(code) {
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(`${SYNC_SEEDED_PREFIX}${slotKey(code)}`) === '1'
  } catch {
    return false
  }
}

export function markCodeSyncSeeded(code) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${SYNC_SEEDED_PREFIX}${slotKey(code)}`, '1')
  } catch {
    // ignore
  }
}

export function saveCodeSnapshot(code, { tripData, wallet, spots, packing, driveLinks }) {
  if (typeof localStorage === 'undefined') return
  try {
    const payload = {
      trip: tripData,
      wallet: normalizeWallet(wallet),
      spots: spots?.spots ? spots : { spots: [] },
      packing: packingStateToJson(packing),
      driveLinks: driveLinks ? normalizeDriveLinks(driveLinks) : undefined,
      savedAt: Date.now(),
    }
    localStorage.setItem(snapshotStorageKey(code), JSON.stringify(payload))
  } catch (e) {
    console.warn('[tour] 無法寫入行程代碼快取', e)
  }
}

export function loadCodeSnapshot(code) {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(snapshotStorageKey(code))
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return null
    const prepared =
      Array.isArray(p.trip) && p.trip.length > 0 ? prepareTripData(p.trip) : null
    const trip = prepared?.trip ?? null
    let wallet =
      p.wallet && typeof p.wallet === 'object' ? normalizeWallet(p.wallet) : null
    if (wallet && prepared?.dayIdRemap?.size) {
      wallet = remapWalletDayIds(wallet, prepared.dayIdRemap)
    }
    let spots = null
    if (p.spots && typeof p.spots === 'object' && Array.isArray(p.spots.spots)) {
      spots = { spots: p.spots.spots }
    }
    const packing = p.packing ? packingStateFromJson(p.packing) : null
    const driveLinks =
      p.driveLinks && typeof p.driveLinks === 'object'
        ? normalizeDriveLinks(p.driveLinks)
        : null
    if (!trip && !wallet && !spots && !packing && !driveLinks) return null
    return { tripData: trip, wallet, spots, packing, driveLinks }
  } catch {
    return null
  }
}

function bundleFromLocalStorage() {
  const { trip: tripData, dayIdRemap } = loadTripDataWithMeta()
  let wallet = loadWallet()
  if (dayIdRemap.size) {
    wallet = remapWalletDayIds(wallet, dayIdRemap)
    saveWallet(wallet)
  }
  return {
    tripData,
    wallet,
    spots: loadSpots(),
    packing: loadPackingState(),
    driveLinks: loadCustomDriveLinks(),
  }
}

/** App 啟動時：若有共用代碼則優先載入該代碼的快照，否則用本機槽位／舊版全域儲存 */
export function loadInitialTourBundle() {
  const code = loadShareCode()
  if (code && isValidShareCode(code)) {
    const snap = loadCodeSnapshot(code)
    if (snap) {
      return {
        tripData: snap.tripData ?? loadTripData(),
        wallet: snap.wallet ?? loadWallet(),
        spots: snap.spots ?? loadSpots(),
        packing: snap.packing ?? loadPackingState(),
        driveLinks: snap.driveLinks ?? loadCustomDriveLinks(),
      }
    }
  } else {
    const localSnap = loadCodeSnapshot(LOCAL_ONLY_SLOT)
    if (localSnap) {
      return {
        tripData: localSnap.tripData ?? loadTripData(),
        wallet: localSnap.wallet ?? loadWallet(),
        spots: localSnap.spots ?? loadSpots(),
        packing: localSnap.packing ?? loadPackingState(),
        driveLinks: localSnap.driveLinks ?? loadCustomDriveLinks(),
      }
    }
  }
  return bundleFromLocalStorage()
}
