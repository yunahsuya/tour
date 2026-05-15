import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

const COLLECTION = 'userTours'
const SYNC_DEBOUNCE_MS = 1400
const PULL_INTERVAL_MS = 90_000

function stableSnapshot(tripData, wallet, spots) {
  return JSON.stringify({ tripData, wallet, spots })
}

function parseFirestorePayload(data) {
  const trip = Array.isArray(data.trip) ? data.trip : null
  const walletRaw = data.wallet && typeof data.wallet === 'object' ? data.wallet : null
  const wallet = walletRaw ? normalizeWallet(walletRaw) : null
  let spots = null
  if (data.spots && typeof data.spots === 'object' && Array.isArray(data.spots.spots)) {
    spots = { spots: data.spots.spots }
  }
  return { trip, wallet, spots }
}

/**
 * Firestore + 匿名登入：同一瀏覽器／裝置會重用匿名帳號，多裝置若要同一份雲端資料需另行綁定帳號（本版僅匿名）。
 * 從雲端套用資料或成功上傳後，會 mirror 到 localStorage + 分段 Cookie。
 */
export function useFirebaseTourSync({ tripData, wallet, spots, setTripData, setWallet, setSpots }) {
  const tripRef = useRef(tripData)
  const walletRef = useRef(wallet)
  const spotsRef = useRef(spots)

  useLayoutEffect(() => {
    tripRef.current = tripData
    walletRef.current = wallet
    spotsRef.current = spots
  }, [tripData, wallet, spots])

  const [syncUid, setSyncUid] = useState(null)
  const lastPushedJson = useRef('')
  const applyingRemote = useRef(false)
  const pushTimer = useRef(null)
  const dbRef = useRef(null)

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined

    let stopped = false
    const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
    const auth = getAuth(app)
    const db = getFirestore(app)
    dbRef.current = db

    async function pushRemote(uid) {
      const t = tripRef.current
      const w = walletRef.current
      const s = spotsRef.current
      await setDoc(
        doc(db, COLLECTION, uid),
        {
          trip: t,
          wallet: w,
          spots: s,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      lastPushedJson.current = stableSnapshot(t, w, s)
      localStorage.setItem('tour-local-write-ts', String(Date.now()))
      mirrorTourDataToBrowserCaches({ tripData: t, wallet: w, spots: s })
    }

    function applyRemoteDoc(data) {
      const { trip, wallet: w, spots: sp } = parseFirestorePayload(data)
      applyingRemote.current = true
      try {
        if (trip && trip.length > 0) setTripData(trip)
        if (w) setWallet(w)
        if (sp) setSpots(sp)
        const td = trip && trip.length > 0 ? trip : tripRef.current
        const wl = w ?? walletRef.current
        const st = sp ?? spotsRef.current
        mirrorTourDataToBrowserCaches({ tripData: td, wallet: wl, spots: st })
        lastPushedJson.current = stableSnapshot(td, wl, st)
      } finally {
        queueMicrotask(() => {
          applyingRemote.current = false
        })
      }
    }

    async function pullRemote(uid) {
      const snap = await getDoc(doc(db, COLLECTION, uid))
      if (stopped) return
      if (!snap.exists()) {
        await pushRemote(uid)
        localStorage.setItem('tour-sync-seeded', '1')
        return
      }
      const d = snap.data()
      const remoteMs =
        d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : 0
      const localMs = Number(localStorage.getItem('tour-local-write-ts') || 0)
      const hasCloudPayload = Boolean(
        (Array.isArray(d.trip) && d.trip.length > 0) ||
          (d.wallet && typeof d.wallet === 'object'),
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
    }

    let intervalId

    ;(async () => {
      try {
        const cred = await signInAnonymously(auth)
        if (stopped) return
        setSyncUid(cred.user.uid)
        await pullRemote(cred.user.uid)
        intervalId = window.setInterval(() => {
          pullRemote(cred.user.uid)
        }, PULL_INTERVAL_MS)
      } catch (e) {
        console.warn('[tour] Firebase 初始化失敗', e)
      }
    })()

    return () => {
      stopped = true
      if (intervalId) clearInterval(intervalId)
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [setTripData, setWallet, setSpots])

  useEffect(() => {
    if (!isFirebaseConfigured() || !syncUid) return undefined
    if (applyingRemote.current) return undefined

    const snap = stableSnapshot(tripData, wallet, spots)
    if (snap === lastPushedJson.current) return undefined

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      const uid = syncUid
      if (!uid || applyingRemote.current) return
      const db = dbRef.current
      if (!db) return
      setDoc(
        doc(db, COLLECTION, uid),
        {
          trip: tripRef.current,
          wallet: walletRef.current,
          spots: spotsRef.current,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
        .then(() => {
          lastPushedJson.current = stableSnapshot(
            tripRef.current,
            walletRef.current,
            spotsRef.current,
          )
          localStorage.setItem('tour-local-write-ts', String(Date.now()))
          mirrorTourDataToBrowserCaches({
            tripData: tripRef.current,
            wallet: walletRef.current,
            spots: spotsRef.current,
          })
        })
        .catch((e) => console.warn('[tour] 寫入 Firestore 失敗', e))
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [syncUid, tripData, wallet, spots])
}
