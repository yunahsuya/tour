import { useEffect, useMemo, useRef, useState } from 'react'
import { flattenDays } from './data/trip.js'
import {
  addSpot as addSpotData,
  loadSpots,
  removeSpot as removeSpotData,
  saveSpots,
  updateSpot as updateSpotData,
} from './spotsStorage.js'
import { clearTripStorage, loadTripData, saveTripData } from './tripStorage.js'
import {
  addWalletEntry,
  addWalletItemLabel,
  loadWallet,
  removeWalletEntry,
  saveWallet,
  sumAllByPayer,
  sumDay,
} from './walletStorage.js'
import { formatForeignFromTwd, parseAmountInput, toTwd } from './fxRates.js'
import { EMPTY_ITEMS, WALLET_PAYERS } from './constants/appConstants.js'
import { appendItemToTrip, removeItemFromTrip, updateItemInTrip } from './tripEdit.js'
import { DateStrip } from './components/layout/DateStrip.jsx'
import { HeroHeader } from './components/layout/HeroHeader.jsx'
import { IconNav } from './components/icons/Icons.jsx'
import { InfoPillPanel } from './components/trip/InfoPillPanel.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { ItineraryPage } from './pages/ItineraryPage.jsx'
import { MapPage } from './pages/MapPage.jsx'
import { SpotsPage } from './pages/SpotsPage.jsx'
import { WalletPage } from './pages/WalletPage.jsx'
import './App.css'

export default function App() {
  const [tripData, setTripData] = useState(() => loadTripData())
  const [tab, setTab] = useState('home')
  const [filter, setFilter] = useState('all')
  const [dayIndex, setDayIndex] = useState(0)
  const [showAllItems, setShowAllItems] = useState(false)
  const [simpleListExpanded, setSimpleListExpanded] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [wallet, setWallet] = useState(() => loadWallet())
  const [spots, setSpots] = useState(() => loadSpots())
  const [walletMode, setWalletMode] = useState('daily')
  const [walletNote, setWalletNote] = useState('')
  const [walletItemMenuOpen, setWalletItemMenuOpen] = useState(false)
  const [walletItemNewDraft, setWalletItemNewDraft] = useState('')
  const walletItemComboRef = useRef(null)
  const [walletAmount, setWalletAmount] = useState('')
  const [walletCurrency, setWalletCurrency] = useState('EUR')
  const [walletPaidBy, setWalletPaidBy] = useState(WALLET_PAYERS[0])
  const [fxConvCode, setFxConvCode] = useState('EUR')
  const [fxConvForeign, setFxConvForeign] = useState('')
  const [fxConvTwd, setFxConvTwd] = useState('')
  const [spotTitle, setSpotTitle] = useState('')
  const [spotNote, setSpotNote] = useState('')
  const [spotMapUrl, setSpotMapUrl] = useState('')
  const [showSpotForm, setShowSpotForm] = useState(false)
  const [editingSpotId, setEditingSpotId] = useState(null)
  const [editSpotTitle, setEditSpotTitle] = useState('')
  const [editSpotNote, setEditSpotNote] = useState('')
  const [editSpotMapUrl, setEditSpotMapUrl] = useState('')
  const stripRef = useRef(null)
  const cardRef = useRef(null)
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  useEffect(() => {
    function onOnline() {
      setIsOffline(false)
    }
    function onOffline() {
      setIsOffline(true)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  useEffect(() => {
    if (!walletItemMenuOpen) return
    function onPointerDown(e) {
      const el = walletItemComboRef.current
      if (el && !el.contains(e.target)) setWalletItemMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [walletItemMenuOpen])

  const allPairs = useMemo(() => flattenDays(tripData), [tripData])

  const visiblePairs = useMemo(() => {
    if (filter === 'all') return allPairs
    return allPairs.filter((p) => p.region.id === filter)
  }, [allPairs, filter])

  const totalDays = visiblePairs.length
  const safeIndex = Math.min(dayIndex, Math.max(0, totalDays - 1))
  const current = visiblePairs[safeIndex]
  const items = current?.day.items ?? EMPTY_ITEMS
  const previewCount = 5
  const hiddenCount = Math.max(0, items.length - previewCount)
  const listItems = showAllItems ? items : items.slice(0, previewCount)

  const SIMPLE_PREVIEW_MAX = 4
  const simplePreviewItems = simpleListExpanded ? items : items.slice(0, SIMPLE_PREVIEW_MAX)
  const simpleHiddenCount = Math.max(0, items.length - SIMPLE_PREVIEW_MAX)
  const regionShort = current?.region.name.split('（')[0]?.trim() ?? ''

  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-day-idx="${safeIndex}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [safeIndex, filter, totalDays])

  const progressPct = totalDays <= 1 ? 100 : (safeIndex / (totalDays - 1)) * 100

  function goPrev() {
    setShowAllItems(false)
    setSimpleListExpanded(false)
    setFxConvForeign('')
    setFxConvTwd('')
    setDayIndex((i) => Math.max(0, i - 1))
  }

  function goNext() {
    setShowAllItems(false)
    setSimpleListExpanded(false)
    setFxConvForeign('')
    setFxConvTwd('')
    setDayIndex((i) => Math.min(totalDays - 1, i + 1))
  }

  async function handleInstallClick() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  function persist(nextTrip) {
    saveTripData(nextTrip)
    setTripData(nextTrip)
  }

  function handleUpdateItem(itemIndex, patch) {
    if (!current) return
    const next = updateItemInTrip(
      tripData,
      current.region.id,
      current.day.id,
      itemIndex,
      patch,
    )
    persist(next)
  }

  function handleRemoveItem(itemIndex) {
    if (!current) return false
    const it = items[itemIndex]
    const label = it?.title ?? '此項目'
    if (!window.confirm(`要刪除「${label}」嗎？此動作無法復原。`)) return false
    const next = removeItemFromTrip(tripData, current.region.id, current.day.id, itemIndex)
    persist(next)
    return true
  }

  function handleResetTrip() {
    if (!window.confirm('重設為預設行程？此裝置上已編輯的內容會清除。')) return
    clearTripStorage()
    setTripData(loadTripData())
    setDayIndex(0)
    setShowAllItems(false)
    setSimpleListExpanded(false)
    setFxConvForeign('')
    setFxConvTwd('')
  }

  function handleAppendItem() {
    if (!current) return
    const next = appendItemToTrip(tripData, current.region.id, current.day.id, {
      type: 'activity',
      time: '',
      title: '新行程',
      detail: '',
    })
    persist(next)
    setShowAllItems(true)
  }

  function handleAddSpotToItinerary(spot) {
    if (!current?.day?.id) {
      window.alert('目前沒有可加入的日期。請確認行程資料，或先切換到「行程」頁面選擇一天。')
      return
    }
    const title = spot.title?.trim() || '新行程'
    const detail = spot.note?.trim() ? spot.note.trim() : undefined
    if (
      !window.confirm(
        `要將「${title}」加入「${current.day.label}」（${current.region.name.split('（')[0]?.trim() ?? current.region.name}）嗎？`,
      )
    )
      return
    const next = appendItemToTrip(tripData, current.region.id, current.day.id, {
      type: 'activity',
      time: '',
      title,
      detail,
      ...(spot.mapUrl?.trim() ? { mapUrl: spot.mapUrl.trim() } : {}),
    })
    persist(next)
    setShowAllItems(true)
    setTab('itinerary')
  }

  function handleAddWallet(e) {
    e.preventDefault()
    if (!current?.day.id) return
    const itemTitle = walletNote.trim()
    if (!itemTitle) {
      window.alert('請選擇或輸入項目')
      return
    }
    const amt = parseAmountInput(walletAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      window.alert('請輸入大於 0 的金額')
      return
    }
    const twdVal = walletCurrency === 'TWD' ? Math.round(amt) : toTwd(amt, walletCurrency)
    if (!Number.isFinite(twdVal) || twdVal <= 0) {
      window.alert('無法換算為台幣，請檢查金額與幣別')
      return
    }
    const next = addWalletEntry(wallet, current.day.id, {
      note: itemTitle,
      twd: twdVal,
      foreignAmount: walletCurrency !== 'TWD' ? amt : undefined,
      foreignCurrency: walletCurrency !== 'TWD' ? walletCurrency : undefined,
      paidBy: walletPaidBy,
    })
    const withLabel = addWalletItemLabel(next, itemTitle)
    saveWallet(withLabel)
    setWallet(withLabel)
    setWalletNote('')
    setWalletItemMenuOpen(false)
    setWalletItemNewDraft('')
    setWalletAmount('')
  }

  function commitNewLabelFromMenu() {
    const t = walletItemNewDraft.trim()
    if (!t) {
      window.alert('請輸入項目名稱')
      return
    }
    const next = addWalletItemLabel(wallet, t)
    saveWallet(next)
    setWallet(next)
    setWalletNote(t)
    setWalletItemNewDraft('')
    setWalletItemMenuOpen(false)
  }

  function handleRemoveWalletEntry(entryId) {
    if (!current?.day.id) return
    const next = removeWalletEntry(wallet, current.day.id, entryId)
    saveWallet(next)
    setWallet(next)
  }

  function handleFxForeignInput(e) {
    const v = e.target.value
    setFxConvForeign(v)
    const n = parseAmountInput(v)
    if (!Number.isFinite(n)) {
      setFxConvTwd('')
      return
    }
    const twd = toTwd(n, fxConvCode)
    setFxConvTwd(Number.isFinite(twd) ? String(twd) : '')
  }

  function handleFxTwdInput(e) {
    const v = e.target.value
    setFxConvTwd(v)
    const n = parseAmountInput(v)
    if (!Number.isFinite(n)) {
      setFxConvForeign('')
      return
    }
    setFxConvForeign(formatForeignFromTwd(n, fxConvCode))
  }

  function handleFxCodeChange(e) {
    const code = e.target.value
    setFxConvCode(code)
    const n = parseAmountInput(fxConvForeign)
    if (Number.isFinite(n)) {
      const twd = toTwd(n, code)
      setFxConvTwd(Number.isFinite(twd) ? String(twd) : '')
      return
    }
    const t = parseAmountInput(fxConvTwd)
    if (Number.isFinite(t)) {
      setFxConvForeign(formatForeignFromTwd(t, code))
    }
  }

  function handleAddSpot(e) {
    e.preventDefault()
    const next = addSpotData(spots, { title: spotTitle, note: spotNote, mapUrl: spotMapUrl })
    saveSpots(next)
    setSpots(next)
    setSpotTitle('')
    setSpotNote('')
    setSpotMapUrl('')
    setShowSpotForm(false)
    setEditingSpotId(null)
    setEditSpotTitle('')
    setEditSpotNote('')
    setEditSpotMapUrl('')
  }

  function handleRemoveSpot(id) {
    if (editingSpotId === id) {
      setEditingSpotId(null)
      setEditSpotTitle('')
      setEditSpotNote('')
      setEditSpotMapUrl('')
    }
    const next = removeSpotData(spots, id)
    saveSpots(next)
    setSpots(next)
  }

  function beginEditSpot(s) {
    setShowSpotForm(false)
    setEditingSpotId(s.id)
    setEditSpotTitle(s.title)
    setEditSpotNote(s.note ?? '')
    setEditSpotMapUrl(s.mapUrl ?? '')
  }

  function cancelEditSpot() {
    setEditingSpotId(null)
    setEditSpotTitle('')
    setEditSpotNote('')
    setEditSpotMapUrl('')
  }

  function handleSaveSpotEdit(e) {
    e.preventDefault()
    if (!editingSpotId) return
    const next = updateSpotData(spots, editingSpotId, {
      title: editSpotTitle.trim() || '未命名景點',
      note: editSpotNote,
      mapUrl: editSpotMapUrl,
    })
    saveSpots(next)
    setSpots(next)
    cancelEditSpot()
  }

  const dayEntries = current?.day.id ? wallet.byDay[current.day.id] ?? [] : []
  const dayWalletTotal = current?.day.id ? sumDay(wallet, current.day.id) : 0
  const walletSummarySub = useMemo(() => {
    const list = current?.day.id ? wallet.byDay[current.day.id] ?? [] : []
    const total = current?.day.id ? sumDay(wallet, current.day.id) : 0
    const foreign = list.some((e) => Boolean(e.foreignCurrency))
    if (total <= 0 && list.length === 0) return '尚無外幣支出'
    if (total <= 0) return '尚無外幣支出'
    if (foreign) return '含外幣紀錄（已換算為台幣）'
    return '皆為台幣紀錄'
  }, [current?.day.id, wallet])

  const walletFormParsed = parseAmountInput(walletAmount)
  const walletFormTwdPreview =
    walletCurrency === 'TWD'
      ? Number.isFinite(walletFormParsed)
        ? Math.round(walletFormParsed)
        : NaN
      : toTwd(walletFormParsed, walletCurrency)

  const walletBreakdown = useMemo(
    () =>
      allPairs
        .map(({ day }) => ({
          id: day.id,
          label: day.label,
          total: sumDay(wallet, day.id),
        }))
        .filter((x) => x.total > 0),
    [allPairs, wallet],
  )

  const walletPayerBreakdown = useMemo(() => {
    const rows = sumAllByPayer(wallet)
    const rank = (name) => {
      const i = WALLET_PAYERS.indexOf(name)
      if (i >= 0) return i
      if (name === '未指定付款人') return 1000
      return 100
    }
    return [...rows].sort((a, b) => {
      const ra = rank(a[0])
      const rb = rank(b[0])
      if (ra !== rb) return ra - rb
      return b[1] - a[1]
    })
  }, [wallet])

  const mapPlaces = items
    .filter((it) => it.type === 'activity' || it.type === 'stay')
    .map((it) => ({ title: it.title, key: it.title }))

  const dayImportantLinks = useMemo(() => {
    const out = []
    const seen = new Set()
    for (const it of items) {
      for (const link of it.links ?? []) {
        if (!link?.href || seen.has(link.href)) continue
        seen.add(link.href)
        out.push({
          label: link.label || link.href,
          href: link.href,
          from: it.title,
        })
      }
    }
    return out
  }, [items])

  const showFab = tab === 'home' || tab === 'itinerary' || tab === 'spots'

  function onFilterChange(id) {
    setFilter(id)
    setDayIndex(0)
    setShowAllItems(false)
    setSimpleListExpanded(false)
    setFxConvForeign('')
    setFxConvTwd('')
  }

  function onSelectDay(idx) {
    setDayIndex(idx)
    setShowAllItems(false)
    setSimpleListExpanded(false)
    setFxConvForeign('')
    setFxConvTwd('')
  }

  function onCancelSpotForm() {
    setShowSpotForm(false)
    setSpotMapUrl('')
    cancelEditSpot()
  }

  return (
    <div className={`app ${showFab ? 'app--fab' : ''}`}>
      {isOffline ? (
        <p className="app-offline-banner" role="status">
          離線中：已安裝並開啟過的頁面可繼續瀏覽本機行程、記帳與景點；地圖與外部網址需網路。
        </p>
      ) : null}
      <HeroHeader tripData={tripData} filter={filter} onResetTrip={handleResetTrip} onFilterChange={onFilterChange} />

      <DateStrip
        stripRef={stripRef}
        visiblePairs={visiblePairs}
        safeIndex={safeIndex}
        totalDays={totalDays}
        progressPct={progressPct}
        onSelectDay={onSelectDay}
        goPrev={goPrev}
        goNext={goNext}
      />

      {(tab === 'home' || tab === 'itinerary') && <InfoPillPanel dayImportantLinks={dayImportantLinks} />}

      {tab === 'home' && (
        <HomePage
          cardRef={cardRef}
          current={current}
          regionShort={regionShort}
          items={items}
          simplePreviewItems={simplePreviewItems}
          simpleHiddenCount={simpleHiddenCount}
          simpleListExpanded={simpleListExpanded}
          onToggleSimpleExpanded={() => setSimpleListExpanded((v) => !v)}
          onExpandSimpleAll={() => setSimpleListExpanded(true)}
          listItems={listItems}
          showAllItems={showAllItems}
          hiddenCount={hiddenCount}
          onToggleShowAllItems={() => setShowAllItems((v) => !v)}
          onShowAllItems={() => setShowAllItems(true)}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onNavigateTab={setTab}
        />
      )}

      {tab === 'itinerary' && (
        <ItineraryPage
          cardRef={cardRef}
          current={current}
          listItems={listItems}
          showAllItems={showAllItems}
          hiddenCount={hiddenCount}
          onToggleShowAllItems={() => setShowAllItems((v) => !v)}
          onShowAllItems={() => setShowAllItems(true)}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
        />
      )}

      {tab === 'map' && <MapPage current={current} items={items} mapPlaces={mapPlaces} />}

      {tab === 'wallet' && (
        <WalletPage
          current={current}
          wallet={wallet}
          walletMode={walletMode}
          setWalletMode={setWalletMode}
          dayEntries={dayEntries}
          dayWalletTotal={dayWalletTotal}
          walletSummarySub={walletSummarySub}
          fxConvCode={fxConvCode}
          handleFxCodeChange={handleFxCodeChange}
          fxConvForeign={fxConvForeign}
          handleFxForeignInput={handleFxForeignInput}
          fxConvTwd={fxConvTwd}
          handleFxTwdInput={handleFxTwdInput}
          handleAddWallet={handleAddWallet}
          walletItemComboRef={walletItemComboRef}
          walletItemMenuOpen={walletItemMenuOpen}
          setWalletItemMenuOpen={setWalletItemMenuOpen}
          walletNote={walletNote}
          walletItemNewDraft={walletItemNewDraft}
          setWalletItemNewDraft={setWalletItemNewDraft}
          commitNewLabelFromMenu={commitNewLabelFromMenu}
          walletAmount={walletAmount}
          setWalletAmount={setWalletAmount}
          walletCurrency={walletCurrency}
          setWalletCurrency={setWalletCurrency}
          walletPaidBy={walletPaidBy}
          setWalletPaidBy={setWalletPaidBy}
          walletFormTwdPreview={walletFormTwdPreview}
          handleRemoveWalletEntry={handleRemoveWalletEntry}
          walletBreakdown={walletBreakdown}
          walletPayerBreakdown={walletPayerBreakdown}
          setWallet={setWallet}
          setWalletNote={setWalletNote}
        />
      )}

      {tab === 'spots' && (
        <SpotsPage
          spots={spots}
          showSpotForm={showSpotForm}
          spotTitle={spotTitle}
          setSpotTitle={setSpotTitle}
          spotNote={spotNote}
          setSpotNote={setSpotNote}
          spotMapUrl={spotMapUrl}
          setSpotMapUrl={setSpotMapUrl}
          handleAddSpot={handleAddSpot}
          editingSpotId={editingSpotId}
          editSpotTitle={editSpotTitle}
          setEditSpotTitle={setEditSpotTitle}
          editSpotNote={editSpotNote}
          setEditSpotNote={setEditSpotNote}
          editSpotMapUrl={editSpotMapUrl}
          setEditSpotMapUrl={setEditSpotMapUrl}
          handleSaveSpotEdit={handleSaveSpotEdit}
          beginEditSpot={beginEditSpot}
          cancelEditSpot={cancelEditSpot}
          handleRemoveSpot={handleRemoveSpot}
          handleAddSpotToItinerary={handleAddSpotToItinerary}
          onCancelSpotForm={onCancelSpotForm}
        />
      )}

      {installPrompt && (
        <button type="button" className="install-banner" onClick={handleInstallClick}>
          安裝到裝置（全螢幕、像 App）
        </button>
      )}
      <p className="fine-print">
        行程請在該列點「編輯」修改文字與地圖連結；備用景點請在卡片點「編輯」修改名稱、地圖連結與備註。齒輪可重設預設。記帳／景點存在此瀏覽器。
        離線：請先以 HTTPS 部署或本機執行 npm run build 後 npm run preview，用瀏覽器完整開啟一次再關閉網路；已安裝為 App 者亦可離線開啟。
        PWA：Chrome／Edge「安裝應用程式」；iPhone Safari「加入主畫面」。
      </p>

      {showFab && (
        <button
          type="button"
          className="fab"
          aria-label={tab === 'spots' ? '新增備用景點' : '新增行程項目'}
          onClick={() => {
            if (tab === 'home' || tab === 'itinerary') handleAppendItem()
            else if (tab === 'spots') {
              cancelEditSpot()
              setSpotMapUrl('')
              setShowSpotForm(true)
            }
          }}
        >
          +
        </button>
      )}

      <nav className="bottom-nav" aria-label="主選單">
        <button
          type="button"
          className={tab === 'itinerary' ? 'bottom-nav-item bottom-nav-item--active' : 'bottom-nav-item'}
          onClick={() => setTab('itinerary')}
        >
          <IconNav name="itinerary" />
          <span>行程</span>
        </button>
        <button
          type="button"
          className={tab === 'map' ? 'bottom-nav-item bottom-nav-item--active' : 'bottom-nav-item'}
          onClick={() => setTab('map')}
        >
          <IconNav name="map" />
          <span>地圖</span>
        </button>
        <button
          type="button"
          className={
            tab === 'home' ? 'bottom-nav-item bottom-nav-item--fab bottom-nav-item--active' : 'bottom-nav-item bottom-nav-item--fab'
          }
          onClick={() => setTab('home')}
        >
          <IconNav name="home" />
          <span>首頁</span>
        </button>
        <button
          type="button"
          className={tab === 'wallet' ? 'bottom-nav-item bottom-nav-item--active' : 'bottom-nav-item'}
          onClick={() => setTab('wallet')}
        >
          <IconNav name="wallet" />
          <span>記帳</span>
        </button>
        <button
          type="button"
          className={tab === 'spots' ? 'bottom-nav-item bottom-nav-item--active' : 'bottom-nav-item'}
          onClick={() => setTab('spots')}
        >
          <IconNav name="sights" />
          <span>景點</span>
        </button>
      </nav>
    </div>
  )
}
