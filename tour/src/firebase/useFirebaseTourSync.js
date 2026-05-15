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
import { normalizeWallet } from '../walletStorage.js'
import { packingStateFromJson, packingStateToJson } from '../packingListStorage.js'
import { clearShareCode, loadShareCode, saveShareCode } from './shareCodeStorage.js'
import {
  generateShareCode,
  isValidShareCode,
  normalizeShareCode,
} from './shareCodeUtils.js'
import { describeFirebaseSyncError } from './firebaseErrors.js'

const COLLECTION = 'sharedTours'
const SYNC_DEBOUNCE_MS = 1400
const PULL_INTERVAL_MS = 90_000

function stableSnapshot(tripData, wallet, spots, packing) {
  return JSON.stringify({ tripData, wallet, spots, packing: packingStateToJson(packing) })
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
  return { trip, wallet, spots, packing }
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
  setTripData,
  setWallet,
  setSpots,
  setPackingListState,
}) {
  const tripRef = useRef(tripData)
  const walletRef = useRef(wallet)
  const spotsRef = useRef(spots)
  const packingRef = useRef(packingListState)

  useLayoutEffect(() => {
    tripRef.current = tripData
    walletRef.current = wallet
    spotsRef.current = spots
    packingRef.current = packingListState
  }, [tripData, wallet, spots, packingListState])

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

  const setShareCode = useCallback((code) => {
    const normalized = normalizeShareCode(code)
    saveShareCode(normalized)
    setShareCodeState(normalized)
    setSyncError(null)
  }, [])

  const applyRemoteDoc = useCallback(
    (data) => {
      const { trip, wallet: w, spots: sp, packing: pk } = parseFirestorePayload(data)
      applyingRemote.current = true
      try {
        if (trip && trip.length > 0) setTripData(trip)
        if (w) setWallet(w)
        if (sp) setSpots(sp)
        if (pk) setPackingListState(pk)
        const td = trip && trip.length > 0 ? trip : tripRef.current
        const wl = w ?? walletRef.current
        const st = sp ?? spotsRef.current
        const pkUse = pk ?? packingRef.current
        mirrorTourDataToBrowserCaches({
          tripData: td,
          wallet: wl,
          spots: st,
          packing: pkUse,
        })
        lastPushedJson.current = stableSnapshot(td, wl, st, pkUse)
      } finally {
        queueMicrotask(() => {
          applyingRemote.current = false
        })
      }
    },
    [setTripData, setWallet, setSpots, setPackingListState],
  )

  const pushRemote = useCallback(async (code) => {
    const db = dbRef.current
    if (!db) return
    const t = tripRef.current
    const w = walletRef.current
    const s = spotsRef.current
    const p = packingRef.current
    await setDoc(
      doc(db, COLLECTION, code),
      {
        trip: t,
        wallet: w,
        spots: s,
        packing: packingStateToJson(p),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    lastPushedJson.current = stableSnapshot(t, w, s, p)
    localStorage.setItem('tour-local-write-ts', String(Date.now()))
    mirrorTourDataToBrowserCaches({ tripData: t, wallet: w, spots: s, packing: p })
  }, [])

  const pullRemote = useCallback(
    async (code) => {
      const db = dbRef.current
      if (!db) return
      const snap = await getDoc(doc(db, COLLECTION, code))
      if (!snap.exists()) {
        await pushRemote(code)
        localStorage.setItem('tour-sync-seeded', '1')
        return
      }
      const d = snap.data()
      const remoteMs =
        d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : 0
      const localMs = Number(localStorage.getItem('tour-local-write-ts') || 0)
      const hasCloudPayload = Boolean(
        (Array.isArray(d.trip) && d.trip.length > 0) ||
          (d.wallet && typeof d.wallet === 'object') ||
          d.packing,
      )
      const shouldApply =
        remoteMs > localMs ||
        (remoteMs === 0 && hasCloudPayload && localMs === 0)

      if (shouldApply) {
        applyRemoteDoc(d)
        localStorage.setItem('tour-local-write-ts', String(remoteMs || Date.now()))
        localStorage.setItem('tour-sync-seeded', '1')
      } else if (!localStorage.getItem('tour-sync-seeded')) {
        localStorage.setItem('tour-sync-seeded', '1')
      }
    },
    [applyRemoteDoc, pushRemote],
  )

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

    const snap = stableSnapshot(tripData, wallet, spots, packingListState)
    if (snap === lastPushedJson.current) return undefined

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      if (applyingRemote.current) return
      const activeCode = normalizeShareCode(shareCodeRef.current)
      if (!isValidShareCode(activeCode)) return
      pushRemote(activeCode).catch((e) => {
        console.warn('[tour] 寫入 Firestore 失敗', e)
        setSyncError(`${describeFirebaseSyncError(e)}（本機已保留）`)
      })
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [shareCode, syncReady, tripData, wallet, spots, packingListState, pushRemote])

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
    clearShareCode()
    setShareCodeState('')
    setSyncError(null)
    lastPushedJson.current = ''
  }, [])

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
