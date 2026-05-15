import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  Timestamp,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { getFirebaseConfig, isFirebaseConfigured } from './config.js'
import { mirrorTourDataToBrowserCaches } from './cacheMirror.js'
import { prepareTripData } from '../tripStorage.js'
import { remapWalletDayIds } from '../walletStorage.js'
import { normalizeWallet } from '../walletStorage.js'
import { packingStateFromJson, packingStateToJson } from '../packingListStorage.js'
import { normalizeDriveLinks } from '../driveLinksStorage.js'
import { clearShareCode, loadShareCode, saveShareCode } from './shareCodeStorage.js'
import {
  generateShareCode,
  isValidShareCode,
  normalizeShareCode,
} from './shareCodeUtils.js'
import { describeFirebaseSyncError } from './firebaseErrors.js'
import {
  getCodeLocalWriteTs,
  isCodeSyncSeeded,
  loadCodeSnapshot,
  markCodeSyncSeeded,
  saveCodeSnapshot,
  setCodeLocalWriteTs,
} from './tourCodeCache.js'

const COLLECTION = 'sharedTours'
const SYNC_DEBOUNCE_MS = 1400
const PULL_INTERVAL_MS = 90_000

function stableSnapshot(tripData, wallet, spots, packing, driveLinks) {
  return JSON.stringify({
    tripData,
    wallet,
    spots,
    packing: packingStateToJson(packing),
    driveLinks,
  })
}

function parseFirestorePayload(data) {
  const trip = Array.isArray(data.trip) ? data.trip : null
  const walletRaw = data.wallet && typeof data.wallet === 'object' ? data.wallet : null
  const wallet = walletRaw ? normalizeWallet(walletRaw) : null
  let spots = null
  if (data.spots && typeof data.spots === 'object' && Array.isArray(data.spots.spots)) {
    spots = { spots: data.spots.spots }
  }
  const packing = data.packing ? packingStateFromJson(data.packing) : null
  let driveLinks = null
  if (data.driveLinks && typeof data.driveLinks === 'object') {
    driveLinks = normalizeDriveLinks(data.driveLinks)
  }
  return { trip, wallet, spots, packing, driveLinks }
}

function readCodeFromUrl() {
  if (typeof window === 'undefined') return ''
  try {
    const u = new URL(window.location.href)
    const raw = u.searchParams.get('code') || u.searchParams.get('share') || ''
    const code = normalizeShareCode(raw)
    if (!code) return ''
    u.searchParams.delete('code')
    u.searchParams.delete('share')
    const q = u.searchParams.toString()
    window.history.replaceState({}, '', `${u.pathname}${q ? `?${q}` : ''}${u.hash}`)
    if (isValidShareCode(code)) saveShareCode(code)
    return code
  } catch {
    return ''
  }
}

function initialShareCode() {
  const stored = loadShareCode()
  if (stored) return stored
  return readCodeFromUrl()
}

/**
 * 共用行程代碼：所有裝置讀寫 sharedTours/{code}。
 * 需 Firebase 匿名登入 + .env 設定；未加入代碼時僅使用本機儲存。
 */
export function useFirebaseTourSync({
  tripData,
  wallet,
  spots,
  packingListState,
  customDriveLinks,
  setTripData,
  setWallet,
  setSpots,
  setPackingListState,
  setCustomDriveLinks,
}) {
  const tripRef = useRef(tripData)
  const walletRef = useRef(wallet)
  const spotsRef = useRef(spots)
  const packingRef = useRef(packingListState)
  const driveLinksRef = useRef(customDriveLinks)

  useLayoutEffect(() => {
    tripRef.current = tripData
    walletRef.current = wallet
    spotsRef.current = spots
    packingRef.current = packingListState
    driveLinksRef.current = customDriveLinks
  }, [tripData, wallet, spots, packingListState, customDriveLinks])

  const [shareCode, setShareCodeState] = useState(initialShareCode)
  const [syncReady, setSyncReady] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncError, setSyncError] = useState(null)

  const shareCodeRef = useRef(shareCode)
  useLayoutEffect(() => {
    shareCodeRef.current = shareCode
  }, [shareCode])

  const lastPushedJson = useRef('')
  const applyingRemote = useRef(false)
  const pushTimer = useRef(null)
  const dbRef = useRef(null)
  const prevShareCodeRef = useRef(null)
  /** 切換代碼後須完成 pull，避免把上一個代碼的資料推到新代碼 */
  const pullReadyForCodeRef = useRef('')

  const setShareCode = useCallback((code) => {
    const normalized = normalizeShareCode(code)
    saveShareCode(normalized)
    setShareCodeState(normalized)
    setSyncError(null)
  }, [])

  const applyRemoteDoc = useCallback(
    (data) => {
      const { trip, wallet: w, spots: sp, packing: pk, driveLinks: dl } =
        parseFirestorePayload(data)
      applyingRemote.current = true
      try {
        let dayIdRemap = new Map()
        let td = tripRef.current
        if (trip && trip.length > 0) {
          const prepared = prepareTripData(trip)
          td = prepared.trip
          dayIdRemap = prepared.dayIdRemap
          setTripData(td)
        }
        const wl = remapWalletDayIds(w ?? walletRef.current, dayIdRemap)
        if (w || dayIdRemap.size) setWallet(wl)
        if (sp) setSpots(sp)
        if (pk) setPackingListState(pk)
        const dlUse = dl ?? driveLinksRef.current
        if (dl) setCustomDriveLinks(dlUse)
        const st = sp ?? spotsRef.current
        const pkUse = pk ?? packingRef.current
        mirrorTourDataToBrowserCaches({
          tripData: td,
          wallet: wl,
          spots: st,
          packing: pkUse,
          driveLinks: dlUse,
          shareCode: shareCodeRef.current,
        })
        lastPushedJson.current = stableSnapshot(td, wl, st, pkUse, dlUse)
        saveCodeSnapshot(shareCodeRef.current, {
          tripData: td,
          wallet: wl,
          spots: st,
          packing: pkUse,
          driveLinks: dlUse,
        })
      } finally {
        queueMicrotask(() => {
          applyingRemote.current = false
        })
      }
    },
    [setTripData, setWallet, setSpots, setPackingListState, setCustomDriveLinks],
  )

  const pushRemote = useCallback(async (code) => {
    const db = dbRef.current
    if (!db) return
    const t = tripRef.current
    const w = walletRef.current
    const s = spotsRef.current
    const p = packingRef.current
    const dl = driveLinksRef.current
    await setDoc(
      doc(db, COLLECTION, code),
      {
        trip: t,
        wallet: w,
        spots: s,
        packing: packingStateToJson(p),
        driveLinks: dl,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    lastPushedJson.current = stableSnapshot(t, w, s, p, dl)
    setCodeLocalWriteTs(code, Date.now())
    mirrorTourDataToBrowserCaches({
      tripData: t,
      wallet: w,
      spots: s,
      packing: p,
      driveLinks: dl,
      shareCode: code,
    })
    saveCodeSnapshot(code, { tripData: t, wallet: w, spots: s, packing: p, driveLinks: dl })
  }, [])

  const pullRemote = useCallback(
    async (code) => {
      const db = dbRef.current
      if (!db) return
      const snap = await getDoc(doc(db, COLLECTION, code))
      if (!snap.exists()) {
        await pushRemote(code)
        markCodeSyncSeeded(code)
        pullReadyForCodeRef.current = code
        return
      }
      const d = snap.data()
      const remoteMs =
        d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : 0
      const localMs = getCodeLocalWriteTs(code)
      const hasCloudPayload = Boolean(
        (Array.isArray(d.trip) && d.trip.length > 0) ||
          (d.wallet && typeof d.wallet === 'object') ||
          d.packing ||
          d.driveLinks,
      )
      const shouldApply =
        remoteMs > localMs ||
        (remoteMs === 0 && hasCloudPayload && localMs === 0)

      if (shouldApply) {
        applyRemoteDoc(d)
        setCodeLocalWriteTs(code, remoteMs || Date.now())
        markCodeSyncSeeded(code)
      } else if (!isCodeSyncSeeded(code)) {
        markCodeSyncSeeded(code)
      }
      pullReadyForCodeRef.current = code
    },
    [applyRemoteDoc, pushRemote],
  )

  /** 切換／離開行程代碼時：先存舊代碼快照，再載入新代碼本機快照 */
  useEffect(() => {
    const prev = prevShareCodeRef.current
    const next = normalizeShareCode(shareCode)

    if (prev === next) return

    prevShareCodeRef.current = next
    pullReadyForCodeRef.current = ''
    lastPushedJson.current = ''

    if (prev !== null) {
      saveCodeSnapshot(prev, {
        tripData: tripRef.current,
        wallet: walletRef.current,
        spots: spotsRef.current,
        packing: packingRef.current,
        driveLinks: driveLinksRef.current,
      })
    }

    const snap = next && isValidShareCode(next) ? loadCodeSnapshot(next) : loadCodeSnapshot('')
    if (!snap) return

    applyingRemote.current = true
    try {
      if (snap.tripData) setTripData(snap.tripData)
      if (snap.wallet) setWallet(snap.wallet)
      if (snap.spots) setSpots(snap.spots)
      if (snap.packing) setPackingListState(snap.packing)
      if (snap.driveLinks) setCustomDriveLinks(snap.driveLinks)
      const td = snap.tripData ?? tripRef.current
      const wl = snap.wallet ?? walletRef.current
      const st = snap.spots ?? spotsRef.current
      const pk = snap.packing ?? packingRef.current
      const dl = snap.driveLinks ?? driveLinksRef.current
      mirrorTourDataToBrowserCaches({
        tripData: td,
        wallet: wl,
        spots: st,
        packing: pk,
        driveLinks: dl,
        shareCode: next,
      })
      lastPushedJson.current = stableSnapshot(td, wl, st, pk, dl)
    } finally {
      queueMicrotask(() => {
        applyingRemote.current = false
      })
    }
  }, [shareCode, setTripData, setWallet, setSpots, setPackingListState, setCustomDriveLinks])

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined

    let stopped = false
    const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
    const auth = getAuth(app)
    dbRef.current = getFirestore(app)

    ;(async () => {
      try {
        await signInAnonymously(auth)
        if (!stopped) setSyncReady(true)
      } catch (e) {
        console.warn('[tour] Firebase 初始化失敗', e)
        if (!stopped) setSyncError('無法連線雲端，請稍後再試')
      }
    })()

    return () => {
      stopped = true
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!syncReady) return undefined
    const code = normalizeShareCode(shareCode)
    if (!code || !isValidShareCode(code)) return undefined

    let stopped = false

    async function runPull() {
      if (stopped) return
      setSyncBusy(true)
      setSyncError(null)
      try {
        await pullRemote(code)
      } catch (e) {
        console.warn('[tour] 雲端同步失敗', e)
        if (!stopped) setSyncError(describeFirebaseSyncError(e))
      } finally {
        if (!stopped) setSyncBusy(false)
      }
    }

    runPull()
    const intervalId = window.setInterval(runPull, PULL_INTERVAL_MS)

    return () => {
      stopped = true
      clearInterval(intervalId)
    }
  }, [shareCode, syncReady, pullRemote])

  useEffect(() => {
    if (!syncReady) return undefined
    const code = normalizeShareCode(shareCode)
    if (!code || !isValidShareCode(code)) return undefined
    if (applyingRemote.current) return undefined
    if (pullReadyForCodeRef.current !== code) return undefined

    const snap = stableSnapshot(tripData, wallet, spots, packingListState, customDriveLinks)
    if (snap === lastPushedJson.current) return undefined

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      if (applyingRemote.current) return
      const activeCode = normalizeShareCode(shareCodeRef.current)
      if (!isValidShareCode(activeCode)) return
      if (pullReadyForCodeRef.current !== activeCode) return
      pushRemote(activeCode).catch((e) => {
        console.warn('[tour] 寫入 Firestore 失敗', e)
        setSyncError(`${describeFirebaseSyncError(e)}（本機已保留）`)
      })
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [shareCode, syncReady, tripData, wallet, spots, packingListState, customDriveLinks, pushRemote])

  const createShareCode = useCallback(() => {
    let code = generateShareCode()
    while (!isValidShareCode(code)) {
      code = generateShareCode()
    }
    setShareCode(code)
    return code
  }, [setShareCode])

  const joinShareCode = useCallback(
    (raw) => {
      const code = normalizeShareCode(raw)
      if (!isValidShareCode(code)) {
        setSyncError('代碼需為 6–16 個英數字（不含空格）')
        return false
      }
      setShareCode(code)
      return true
    },
    [setShareCode],
  )

  const leaveShareCode = useCallback(() => {
    const leaving = normalizeShareCode(shareCodeRef.current)
    if (leaving) {
      saveCodeSnapshot(leaving, {
        tripData: tripRef.current,
        wallet: walletRef.current,
        spots: spotsRef.current,
        packing: packingRef.current,
        driveLinks: driveLinksRef.current,
      })
    }
    clearShareCode()
    setShareCodeState('')
    setSyncError(null)
    lastPushedJson.current = ''
    pullReadyForCodeRef.current = ''
    prevShareCodeRef.current = ''

    const localSnap = loadCodeSnapshot('')
    if (!localSnap) return
    applyingRemote.current = true
    try {
      if (localSnap.tripData) setTripData(localSnap.tripData)
      if (localSnap.wallet) setWallet(localSnap.wallet)
      if (localSnap.spots) setSpots(localSnap.spots)
      if (localSnap.packing) setPackingListState(localSnap.packing)
      if (localSnap.driveLinks) setCustomDriveLinks(localSnap.driveLinks)
      mirrorTourDataToBrowserCaches({
        tripData: localSnap.tripData ?? tripRef.current,
        wallet: localSnap.wallet ?? walletRef.current,
        spots: localSnap.spots ?? spotsRef.current,
        packing: localSnap.packing ?? packingRef.current,
        driveLinks: localSnap.driveLinks ?? driveLinksRef.current,
        shareCode: '',
      })
    } finally {
      queueMicrotask(() => {
        applyingRemote.current = false
      })
    }
  }, [setTripData, setWallet, setSpots, setPackingListState, setCustomDriveLinks])

  useEffect(() => {
    const code = normalizeShareCode(shareCode)
    const target = code && isValidShareCode(code) ? code : ''
    const timer = setTimeout(() => {
      saveCodeSnapshot(target, {
        tripData: tripRef.current,
        wallet: walletRef.current,
        spots: spotsRef.current,
        packing: packingRef.current,
        driveLinks: driveLinksRef.current,
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [shareCode, tripData, wallet, spots, packingListState, customDriveLinks])

  return {
    shareCode,
    syncReady: isFirebaseConfigured() && syncReady,
    syncBusy,
    syncError,
    firebaseEnabled: isFirebaseConfigured(),
    createShareCode,
    joinShareCode,
    leaveShareCode,
  }
}
