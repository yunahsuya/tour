import { useEffect, useMemo, useRef, useState } from 'react'
import { flattenDays, tripDriveLinks } from './data/trip.js'
import { parseDayLabel } from './dayPickerMeta.js'
import { googleMapsSearchUrl, osmEmbedUrl } from './mapUtils.js'
import {
  addSpot as addSpotData,
  loadSpots,
  removeSpot as removeSpotData,
  saveSpots,
  updateSpot as updateSpotData,
} from './spotsStorage.js'
import { clearTripStorage, loadTripData, saveTripData } from './tripStorage.js'
import {
  DEFAULT_WALLET_ITEM_LABELS,
  addWalletEntry,
  addWalletItemLabel,
  loadWallet,
  removeWalletEntry,
  removeWalletItemLabel,
  saveWallet,
  sumAll,
  sumAllByPayer,
  sumDay,
} from './walletStorage.js'
import {
  FX_LABELS,
  FX_LAST_UPDATED,
  WALLET_FX_CODES,
  formatForeignFromTwd,
  formatRateLine,
  parseAmountInput,
  toTwd,
} from './fxRates.js'
import './App.css'

const EMPTY_ITEMS = []

const WALLET_PAYERS = ['爸爸', '媽媽', '姐姐', '妹妹']

function formatWalletDateLine(day) {
  if (!day) return ''
  const m = String(day.label).match(/^(\d{1,2}\/\d{1,2})/)
  if (m) return m[1]
  if (day.id && /^\d{4}-\d{2}-\d{2}$/.test(day.id)) {
    const [, mo, d] = day.id.split('-')
    return `${mo}/${d}`
  }
  return day.label ?? ''
}

function formatWalletEntryDisplay(e) {
  const payer = e.paidBy ? `${e.paidBy}付` : null
  let s = payer ? `${e.note} · ${payer} · NT$ ${e.twd.toLocaleString('zh-TW')}` : `${e.note} · NT$ ${e.twd.toLocaleString('zh-TW')}`
  if (e.foreignCurrency && e.foreignAmount != null) {
    const L = FX_LABELS[e.foreignCurrency]
    const sym = L?.sym ?? ''
    s += `（${e.foreignAmount} ${sym} ${e.foreignCurrency}）`
  }
  return s
}

/** 使用者輸入的地圖網址：補上 https、阻擋 javascript: */
function normalizeUserMapUrl(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  if (/^javascript:/i.test(t)) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

/** 從行程項目讀取自訂地圖網址（含舊資料：links 內標為「地圖」者） */
function mapUrlFromTripItem(item) {
  if (item.mapUrl && String(item.mapUrl).trim()) return String(item.mapUrl).trim()
  const leg = item.links?.find((l) => l.label === '地圖連結' || l.label === '地圖')
  return leg?.href?.trim() ?? ''
}

function mapHrefForTripItem(item) {
  const raw = mapUrlFromTripItem(item)
  if (raw) return normalizeUserMapUrl(raw)
  return googleMapsSearchUrl(item.title)
}

function LinkList({ links }) {
  if (!links?.length) return null
  return (
    <ul className="trip-links" onClick={(e) => e.stopPropagation()}>
      {links.map((l) => (
        <li key={l.href}>
          <a href={l.href} target="_blank" rel="noreferrer noopener">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

function splitTimeForCard(time) {
  if (!time || typeof time !== 'string') return { main: '—', sub: '' }
  const m = time.trim().match(/^(.+?)\s*[–-]\s*(.+)$/)
  if (m) return { main: m[1].trim(), sub: m[2].trim() }
  return { main: time.trim(), sub: '' }
}

function parseHmToMinutes(str) {
  const m = String(str).trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** @param {string} time */
function formatDurationFromTimeRange(time) {
  if (!time || typeof time !== 'string') return ''
  const parts = time.trim().split(/\s*[–-]\s*/)
  if (parts.length < 2) return ''
  const start = parseHmToMinutes(parts[0])
  const end = parseHmToMinutes(parts[1])
  if (start == null || end == null) return ''
  let diff = end - start
  if (diff <= 0) diff += 24 * 60
  if (diff < 60) return `${diff} 分鐘`
  const hrs = diff / 60
  if (Number.isInteger(hrs)) return `${hrs} 小時`
  return `${Math.round(hrs * 10) / 10} 小時`
}

/** @param {{ type: string, time?: string, title: string, detail?: string }} item */
function simplePreviewTimeLabel(item) {
  if (item.type === 'activity' && item.time) return splitTimeForCard(item.time).main
  return '—'
}

/** @param {{ type: string, time?: string, title: string, detail?: string }} item */
function simplePreviewMetaLine(item, regionLabel) {
  const region = (regionLabel || '').trim()
  const bits = []
  if (region) bits.push(region)
  if (item.type === 'stay') {
    const d = (item.detail ?? '').trim()
    if (d && d !== '住宿') bits.push(d.split(/[;\n]/)[0].trim().slice(0, 36))
    else bits.push('住宿')
  } else if (item.type === 'block') {
    const d = (item.detail ?? '').trim()
    bits.push(d ? d.slice(0, 40) : '備註')
  } else {
    const dur = formatDurationFromTimeRange(item.time ?? '')
    const d = (item.detail ?? '').trim()
    if (dur) bits.push(dur)
    else if (d) bits.push(d.slice(0, 36))
  }
  return bits.join(' · ')
}

function IconCalendarSimple() {
  return (
    <svg
      className="simple-preview-cal"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8.5 3.5V7M15.5 3.5V7" />
    </svg>
  )
}

function IconNavSend() {
  return (
    <svg className="trip-card-act-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
      />
    </svg>
  )
}

function IconPencilSmall() {
  return (
    <svg className="trip-card-act-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.82z"
      />
    </svg>
  )
}

function IconTrashSmall() {
  return (
    <svg className="trip-card-act-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  )
}

function EditableItemRow({ item, itemIndex, onUpdate, onRemove, layout = 'row', regionLabel = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    time: item.time ?? '',
    title: item.title,
    detail: item.detail ?? '',
    mapUrl: mapUrlFromTripItem(item),
  })

  function openEdit() {
    setDraft({
      time: item.time ?? '',
      title: item.title,
      detail: item.detail ?? '',
      mapUrl: mapUrlFromTripItem(item),
    })
    setEditing(true)
  }

  const hasTime =
    item.time && item.type !== 'stay' && item.type !== 'block'

  const timeCol =
    item.type === 'stay' ? (
      <span className="trip-time trip-time--tag">住宿</span>
    ) : item.type === 'block' ? (
      <span className="trip-time trip-time--tag">備註</span>
    ) : hasTime ? (
      <span className="trip-time">{item.time}</span>
    ) : (
      <span className="trip-time trip-time--muted">—</span>
    )

  const rowClass = [
    'trip-row',
    `trip-row--${item.type}`,
    item.emphasis ? `trip-row--${item.emphasis}` : '',
    editing ? 'trip-row--editing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const cardClass = [
    'trip-card',
    `trip-card--${item.type}`,
    item.emphasis ? `trip-card--${item.emphasis}` : '',
    editing ? 'trip-card--editing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const mapQuery = item.title
  const mapsDir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`
  const mapBrowseHref = mapHrefForTripItem(item)
  const mapNavHref = mapUrlFromTripItem(item) ? normalizeUserMapUrl(mapUrlFromTripItem(item)) : mapsDir

  const typeTag =
    item.type === 'stay' ? '住宿' : item.type === 'block' ? '備註' : '活動'

  let timeMain = '—'
  let timeSub = ''
  if (item.type === 'stay') {
    timeMain = '住宿'
  } else if (item.type === 'block') {
    timeMain = '備註'
  } else if (item.type === 'activity' && item.time) {
    const sp = splitTimeForCard(item.time)
    timeMain = sp.main
    timeSub = sp.sub
  }

  function commit() {
    const title = draft.title.trim() || item.title
    const detailTrim = draft.detail.trim()
    const mapTrim = draft.mapUrl.trim()
    /** @type {Record<string, string | undefined>} */
    const patch = {
      title,
      detail: detailTrim ? detailTrim : undefined,
      mapUrl: mapTrim || '',
    }
    if (item.type === 'activity') {
      const t = draft.time.trim()
      patch.time = t ? t : undefined
    }
    onUpdate(itemIndex, patch)
    setEditing(false)
  }

  function cancel() {
    setDraft({
      time: item.time ?? '',
      title: item.title,
      detail: item.detail ?? '',
      mapUrl: mapUrlFromTripItem(item),
    })
    setEditing(false)
  }

  if (editing) {
    const outerClass = layout === 'card' ? cardClass : rowClass
    return (
      <article className={outerClass}>
        <div className={layout === 'card' ? 'trip-edit-fields trip-edit-fields--card' : 'trip-edit-fields'}>
          {item.type === 'activity' && (
            <label className="trip-edit-label">
              <span>時間</span>
              <input
                className="trip-input"
                value={draft.time}
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                placeholder="例：10:30 – 12:00"
                autoComplete="off"
              />
            </label>
          )}
          <label className="trip-edit-label">
            <span>標題</span>
            <input
              className="trip-input"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              autoComplete="off"
            />
          </label>
          <label className="trip-edit-label">
            <span>地圖連結</span>
            <input
              className="trip-input"
              value={draft.mapUrl}
              onChange={(e) => setDraft((d) => ({ ...d, mapUrl: e.target.value }))}
              placeholder="選填，貼上 Google Maps 等網址；留空則用標題搜尋地圖"
              autoComplete="off"
              inputMode="url"
            />
          </label>
          <label className="trip-edit-label">
            <span>備註</span>
            <textarea
              className="trip-input trip-textarea"
              value={draft.detail}
              onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))}
              rows={3}
              placeholder="可留空"
            />
          </label>
          {(item.links ?? []).some((l) => l.label !== '地圖' && l.label !== '地圖連結') ? (
            <p className="trip-edit-hint">訂位等連結見下方；「地圖／地圖連結」請用上方欄位編輯。</p>
          ) : null}
          <LinkList
            links={(item.links ?? []).filter((l) => l.label !== '地圖' && l.label !== '地圖連結')}
          />
          <div className="trip-edit-actions">
            <button
              type="button"
              className="btn-ghost btn-ghost--danger"
              onClick={() => {
                if (onRemove(itemIndex)) setEditing(false)
              }}
            >
              刪除
            </button>
            <button type="button" className="btn-ghost" onClick={cancel}>
              取消
            </button>
            <button type="button" className="btn-primary" onClick={commit}>
              完成
            </button>
        </div>
        </div>
      </article>
    )
  }

  if (layout === 'card') {
    return (
      <article className={cardClass}>
        <div className="trip-card__inner">
          <div className="trip-card__timeCol">
            <span className="trip-card__timeMain">{timeMain}</span>
            {timeSub ? <span className="trip-card__timeSub">{timeSub}</span> : null}
          </div>
          <div className="trip-card__main">
            <h3 className="trip-card__title">{item.title}</h3>
            <div className="trip-card__tags">
              {regionLabel ? <span className="trip-tag">{regionLabel}</span> : null}
              <span className="trip-tag trip-tag--soft">{typeTag}</span>
            </div>
            <div className="trip-card__rule" aria-hidden />
            {item.detail ? <p className="trip-card__detail">{item.detail}</p> : null}
            <div className="trip-card__links">
              <LinkList
                links={(item.links ?? []).filter((l) => l.label !== '地圖' && l.label !== '地圖連結')}
              />
            </div>
            <div className="trip-card__actions">
              <a className="trip-card__action" href={mapNavHref} target="_blank" rel="noreferrer">
                <IconNavSend />
                導航
              </a>
              <button type="button" className="trip-card__action" onClick={openEdit}>
                <IconPencilSmall />
                編輯
              </button>
        <button
          type="button"
                className="trip-card__action trip-card__action--delete"
                onClick={() => onRemove(itemIndex)}
                aria-label="刪除此行程"
        >
                <IconTrashSmall />
                刪除
        </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={rowClass}>
      <div className="trip-row-inner">
        <div className="trip-row-time">{timeCol}</div>
        <div className="trip-row-body">
          <button
            type="button"
            className="trip-row-edit-btn"
            aria-label="編輯此項目"
            onClick={openEdit}
          >
            編輯
          </button>
          <h3 className="trip-row-title">{item.title}</h3>
          {item.detail ? <p className="trip-row-detail">{item.detail}</p> : null}
          <LinkList
            links={(item.links ?? []).filter((l) => l.label !== '地圖' && l.label !== '地圖連結')}
          />
          <div className="trip-row-actions">
            <a
              className="trip-action-btn"
              href={mapBrowseHref}
              target="_blank"
              rel="noreferrer"
            >
              地圖
            </a>
            <button
              type="button"
              className="trip-action-btn trip-action-btn--delete"
              onClick={() => onRemove(itemIndex)}
              aria-label="刪除此行程"
            >
              刪除
            </button>
        </div>
        </div>
      </div>
    </article>
  )
}

function IconGear() {
  return (
    <svg className="icon-svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.66c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.66c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
      />
          </svg>
  )
}

function IconCalendarOutline() {
  return (
    <svg
      className="info-pill-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10.25h17M8.5 3.5V7M15.5 3.5V7" />
                </svg>
  )
}

function IconFeaturePlans() {
  return (
    <svg
      className="feature-icon feature-icon--stroke"
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8.5 3.5V7M15.5 3.5V7" />
      <path
        fill="currentColor"
        stroke="none"
        opacity="0.35"
        d="M14.5 15.2c.6-.9 1.8-1.1 2.4-.4.5.6.1 1.3-.6 1.8-.8.6-1.4 1.4-1.6 2.4l-.3 1.5-.9-1.2c-.4-.5-.6-1.1-.5-1.7.1-.6.5-1.1 1.5-2.4Z"
      />
                </svg>
  )
}

function IconFeatureMap() {
  return (
    <svg
      className="feature-icon feature-icon--stroke"
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.5 4.5 4 6.2v13.3l5.5-1.7 5 1.6 5.5-1.6V4.8L15 3.2l-5.5 1.3Z" />
      <path d="M9.5 4.5v13.3M14.5 5.8v13.3" />
      <path
        fill="#c62828"
        stroke="#c62828"
        strokeWidth="0.8"
        d="M12 11.2a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Zm0-2.2c-2.4 0-4.3 1.9-4.3 4.2 0 2.5 3.4 6.5 4.1 7.2l.2.2.2-.2c.7-.7 4.1-4.7 4.1-7.2 0-2.3-1.9-4.2-4.3-4.2Z"
      />
                </svg>
  )
}

function IconFeatureWallet() {
  return (
    <svg
      className="feature-icon feature-icon--stroke"
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <ellipse cx="8" cy="16" rx="3.2" ry="1.8" />
      <ellipse cx="12" cy="14.5" rx="3.5" ry="2" />
      <ellipse cx="16.5" cy="16" rx="3.2" ry="1.8" />
      <path d="M17 8.5h3.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3.5" />
      <path d="M12 5v6M9.5 8h5" />
      <path
        fill="currentColor"
        stroke="none"
        d="M10.2 15.8c.3-1.1 1.2-1.9 2.4-1.9 1 0 1.8.5 2.2 1.2M9.8 17.6h4.4M10.4 16.7h3.6"
        opacity="0.85"
      />
      <path d="M18.2 6.3h2.3M19.4 5v2.6" strokeWidth="1.6" />
                </svg>
  )
}

function IconFeatureSaved() {
  return (
    <svg
      className="feature-icon feature-icon--stroke"
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 4.5h10a2 2 0 0 1 2 2v14.5L12 17l-7 4V6.5a2 2 0 0 1 2-2Z" />
      <path
        fill="#c62828"
        stroke="none"
        d="M12 11.2c-.9-1-2.6-1-3.3.2-.5.9-.2 1.9.5 2.7l2.8 2.6 2.8-2.6c.7-.8 1-1.8.5-2.7-.7-1.2-2.4-1.2-3.3-.2Z"
      />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg className="icon-svg icon-svg--lg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
      />
    </svg>
  )
}

function IconNav({ name }) {
  const paths = {
    itinerary:
      'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
    map: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z',
    wallet:
      'M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8h-10v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    sights:
      'M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  }
  return (
    <svg className="icon-svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d={paths[name]} />
    </svg>
  )
}

function updateItemInTrip(trip, regionId, dayId, itemIndex, patch) {
  return trip.map((region) => {
    if (region.id !== regionId) return region
    return {
      ...region,
      days: region.days.map((day) => {
        if (day.id !== dayId) return day
        return {
          ...day,
          items: day.items.map((it, i) => (i === itemIndex ? { ...it, ...patch } : it)),
        }
      }),
    }
  })
}

function appendItemToTrip(trip, regionId, dayId, newItem) {
  return trip.map((region) => {
    if (region.id !== regionId) return region
    return {
      ...region,
      days: region.days.map((day) =>
        day.id !== dayId ? day : { ...day, items: [...day.items, newItem] },
      ),
    }
  })
}

function removeItemFromTrip(trip, regionId, dayId, itemIndex) {
  return trip.map((region) => {
    if (region.id !== regionId) return region
    return {
      ...region,
      days: region.days.map((day) => {
        if (day.id !== dayId) return day
        return { ...day, items: day.items.filter((_, i) => i !== itemIndex) }
      }),
    }
  })
}

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

  const progressPct =
    totalDays <= 1 ? 100 : (safeIndex / (totalDays - 1)) * 100

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

  /** @returns {boolean} 是否已刪除 */
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

  /** 將備用景點加入「目前選定的那一天」行程（與上方日期條／地區篩選一致） */
  function handleAddSpotToItinerary(spot) {
    if (!current?.day?.id) {
      window.alert('目前沒有可加入的日期。請確認行程資料，或先切換到「行程」頁面選擇一天。')
      return
    }
    const title = spot.title?.trim() || '新行程'
    const detail = spot.note?.trim() ? spot.note.trim() : undefined
    if (
      !window.confirm(`要將「${title}」加入「${current.day.label}」（${current.region.name.split('（')[0]?.trim() ?? current.region.name}）嗎？`)
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

  return (
    <div className={`app ${showFab ? 'app--fab' : ''}`}>
      {isOffline ? (
        <p className="app-offline-banner" role="status">
          離線中：已安裝並開啟過的頁面可繼續瀏覽本機行程、記帳與景點；地圖與外部網址需網路。
        </p>
      ) : null}
      <header className="hero">
        <button type="button" className="hero-settings" aria-label="重設為預設行程" onClick={handleResetTrip}>
          <IconGear />
        </button>
        <p className="hero-kicker">London · Barcelona · Seoul · 2026</p>
        <h1 className="hero-title">倫敦巴塞首爾 遊記</h1>
        <nav className="region-chips" aria-label="地區篩選">
          {['all', ...tripData.map((r) => r.id)].map((id) => {
            const label =
              id === 'all'
                ? '全部'
                : `${tripData.find((r) => r.id === id)?.flag ?? ''} ${
                    tripData.find((r) => r.id === id)?.name.split('（')[0] ?? ''
                  }`.trim()
            return (
              <button
                key={id}
                type="button"
                className={filter === id ? 'chip chip--on' : 'chip'}
                onClick={() => {
                  setFilter(id)
                  setDayIndex(0)
                  setShowAllItems(false)
                  setSimpleListExpanded(false)
                  setFxConvForeign('')
                  setFxConvTwd('')
                }}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </header>

      <div className="date-strip-wrap">
        <div className="date-strip" ref={stripRef} role="tablist" aria-label="選擇日期">
          {visiblePairs.map((pair, idx) => {
            const meta = parseDayLabel(pair.day.label)
            const active = idx === safeIndex
            return (
              <button
                key={pair.day.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-day-idx={idx}
                className={active ? 'date-card date-card--active' : 'date-card'}
                onClick={() => {
                  setDayIndex(idx)
                  setShowAllItems(false)
                  setSimpleListExpanded(false)
                  setFxConvForeign('')
                  setFxConvTwd('')
                }}
              >
                <span className="date-card-w">{meta.weekShort}</span>
                <span className="date-card-d">D{idx + 1}</span>
                <span className="date-card-n">{meta.dayNum}</span>
                <span className="date-card-m">{meta.monthStr}</span>
              </button>
            )
          })}
        </div>

        <div className="day-progress" aria-hidden>
          <button type="button" className="day-progress-btn" onClick={goPrev} disabled={safeIndex <= 0}>
            ‹
          </button>
          <div className="day-progress-track">
            <div className="day-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <button
            type="button"
            className="day-progress-btn"
            onClick={goNext}
            disabled={safeIndex >= totalDays - 1}
          >
            ›
          </button>
        </div>
        <p className="day-progress-label">
          Day {safeIndex + 1} / {totalDays}
        </p>
      </div>

      {(tab === 'home' || tab === 'itinerary') && (
        <>
          <section className="info-pill-panel" aria-labelledby="overview-pill-heading">
            <div className="info-pill-panel__header">
              <IconCalendarOutline />
              <h2 className="info-pill-panel__title" id="overview-pill-heading">
                行程總覽 · 重要連結在項目內
              </h2>
            </div>
            <div className="info-pill-panel__body">
              <p className="info-pill-section-kicker">本日行程內的連結</p>
              {dayImportantLinks.length === 0 ? (
                <p className="info-pill-panel__empty info-pill-panel__empty--day">
                  若項目有訂位、官網、票證等連結，會自動列在這裡。
                </p>
              ) : (
                <ul className="info-pill-link-list info-pill-link-list--day-block">
                  {dayImportantLinks.map((link, idx) => (
                    <li key={`${link.href}-${idx}`}>
                      <a href={link.href} target="_blank" rel="noreferrer noopener">
                        {link.label}
                      </a>
                      <span className="info-pill-link-from">來自：{link.from}</span>
            </li>
                  ))}
                </ul>
              )}
              <p className="info-pill-section-kicker info-pill-section-kicker--secondary">
                雲端資料夾（整趟共用）
              </p>
              <ul className="info-pill-link-list info-pill-link-list--drive">
                {tripDriveLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noreferrer noopener">
                      {link.label}
                    </a>
                    <span className="info-pill-link-from">Google Drive</span>
                  </li>
                ))}
          </ul>
        </div>
      </section>

          {tab === 'home' && current && (
            <section className="simple-itinerary-card" aria-labelledby="simple-itin-heading">
              <div className="simple-itinerary-card__inner">
                <div className="simple-itinerary-card__head">
                  <div className="simple-itinerary-card__head-left">
                    <IconCalendarSimple />
                    <h2 className="simple-itinerary-card__title" id="simple-itin-heading">
                      今日行程
                    </h2>
                  </div>
                  {items.length > 0 && simpleHiddenCount > 0 ? (
                    <button
                      type="button"
                      className="link-quiet"
                      onClick={() => setSimpleListExpanded((v) => !v)}
                    >
                      {simpleListExpanded ? '收合' : '查看全部 ›'}
                    </button>
                  ) : null}
                </div>
                {(current.region.flag || regionShort || current.day.subtitle) && (
                  <p className="simple-itinerary-card__sub">
                    {current.region.flag} {regionShort}
                    {current.day.subtitle ? ` · ${current.day.subtitle}` : ''}
                  </p>
                )}
                {simplePreviewItems.length === 0 ? (
                  <p className="simple-itinerary-empty">本日尚無行程</p>
                ) : (
                  <ul className="simple-itinerary-list">
                    {simplePreviewItems.map((item, i) => (
                      <li key={`${current.day.id}-simple-${i}`} className="simple-itinerary-row">
                        <span className="simple-itinerary-time">{simplePreviewTimeLabel(item)}</span>
                        <div className="simple-itinerary-main">
                          <span className="simple-itinerary-row-title">{item.title}</span>
                          <span className="simple-itinerary-meta">{simplePreviewMetaLine(item, regionShort)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {simpleHiddenCount > 0 && !simpleListExpanded ? (
                  <button
                    type="button"
                    className="simple-itinerary-footer"
                    onClick={() => setSimpleListExpanded(true)}
                  >
                    還有 {simpleHiddenCount} 個行程
                  </button>
                ) : null}
              </div>
            </section>
          )}

          {tab === 'home' && (
            <section className="home-grid-section" aria-label="首頁功能捷徑">
              <div className="feature-grid">
                <button type="button" className="feature-tile" onClick={() => setTab('itinerary')}>
                  <IconFeaturePlans />
                  <span className="feature-tile-title">Plans / 每日行程</span>
                  <span className="feature-tile-sub">編輯時間地點與備註</span>
                </button>
                <button type="button" className="feature-tile" onClick={() => setTab('map')}>
                  <IconFeatureMap />
                  <span className="feature-tile-title">Map / 地圖導航</span>
                  <span className="feature-tile-sub">當日所有地點 + 我的位置</span>
                </button>
                <button type="button" className="feature-tile" onClick={() => setTab('wallet')}>
                  <IconFeatureWallet />
                  <span className="feature-tile-title">Wallet / 記帳分帳</span>
                  <span className="feature-tile-sub">自動換算為台幣</span>
                </button>
                <button type="button" className="feature-tile" onClick={() => setTab('spots')}>
                  <IconFeatureSaved />
                  <span className="feature-tile-title">Saved / 備用景點</span>
                  <span className="feature-tile-sub">收藏想去的地方</span>
                </button>
              </div>
            </section>
          )}

          <main
            className={tab === 'home' ? 'main-card main-card--home' : 'main-card'}
            id="itinerary-card"
            ref={cardRef}
          >
            <div className="main-card-head">
              <div className="main-card-head-left">
                <IconCalendar />
                <h2 className="main-card-title">今日行程</h2>
              </div>
              <button
                type="button"
                className="link-quiet"
                onClick={() => setShowAllItems((v) => !v)}
                disabled={hiddenCount === 0}
              >
                {showAllItems ? '收合' : '查看全部'}
                {hiddenCount > 0 && !showAllItems ? ' ›' : ''}
              </button>
            </div>

            {current && (
              <p className="main-card-sub">
                {current.region.flag} {current.day.label}
                {current.day.subtitle ? ` · ${current.day.subtitle}` : ''}
              </p>
            )}

            {tab === 'home' && (
              <p className="main-card-home-hint">
                最上方總覽先列「本日行程內的連結」，其下為「雲端資料夾」；再往下精簡列表可點「查看全部」或「還有 … 個行程」展開。此區為完整卡片，請點各項「編輯」修改。底部「行程」為列表檢視。
              </p>
            )}

            <div className={tab === 'home' ? 'trip-list trip-list--cards' : 'trip-list'}>
              {listItems.map((item, i) => (
                <EditableItemRow
                  key={`${current?.day.id}-${i}`}
                  item={item}
                  itemIndex={i}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  layout={tab === 'home' ? 'card' : 'row'}
                  regionLabel={current?.region.name.split('（')[0]?.trim() ?? ''}
                />
              ))}
            </div>

            {!showAllItems && hiddenCount > 0 && (
              <button type="button" className="more-link" onClick={() => setShowAllItems(true)}>
                還有 {hiddenCount} 個行程
              </button>
            )}
          </main>
        </>
      )}

      {tab === 'map' && !current && (
        <p className="panel-empty">目前沒有行程日可顯示，請確認地區篩選。</p>
      )}

      {tab === 'map' && current && (
        <section className="panel-map" aria-label="地圖">
          <div className="map-frame-wrap">
            <iframe
              className="map-iframe"
              title="OpenStreetMap"
              src={osmEmbedUrl(current.region.id)}
              loading="lazy"
            />
          </div>
          <div className="map-quick-bar">
            <div className="map-quick-cell">
              <span className="map-quick-label">今日行程</span>
              <span className="map-quick-val">{items.length} 筆</span>
            </div>
            <div className="map-quick-cell map-quick-cell--mid">
              <span className="map-quick-label">區域</span>
              <span className="map-quick-val">{current.region.name.split('（')[0]}</span>
            </div>
            <div className="map-quick-cell">
              <span className="map-quick-label">定位</span>
              <button
                type="button"
                className="map-locate-btn"
                onClick={() => {
                  if (!navigator.geolocation) {
                    window.alert('此瀏覽器不支援定位')
                    return
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    },
                    () => window.alert('無法取得定位，請檢查權限'),
                    { enableHighAccuracy: true, timeout: 8000 },
                  )
                }}
              >
                我的位置
              </button>
            </div>
          </div>
          <div className="map-place-list">
            <p className="map-place-list-title">當日可搜地圖</p>
            <ul>
              {mapPlaces.map(({ title, key }) => (
                <li key={key}>
                  <a href={googleMapsSearchUrl(title)} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === 'wallet' && !current && (
        <p className="panel-empty">目前沒有行程日可顯示。</p>
      )}

      {tab === 'wallet' && current && (
        <section className="panel-wallet" aria-label="記帳">
          <div className="segment">
            <button
              type="button"
              className={walletMode === 'daily' ? 'segment-btn segment-btn--on' : 'segment-btn'}
              onClick={() => setWalletMode('daily')}
            >
              每日 Daily
            </button>
            <button
              type="button"
              className={walletMode === 'total' ? 'segment-btn segment-btn--on' : 'segment-btn'}
              onClick={() => setWalletMode('total')}
            >
              累積 Total
            </button>
          </div>

          {walletMode === 'daily' ? (
            <>
              <div className="wallet-card wallet-card--summary">
                <p className="wallet-card-kicker">Today</p>
                <p className="wallet-card-line-title">
                  本日支出 <span className="wallet-card-date-part">{formatWalletDateLine(current.day)}</span>
                </p>
                <p className="wallet-card-total">
                  NT$ <strong>{dayWalletTotal.toLocaleString('zh-TW')}</strong>
                </p>
                <p className="wallet-card-subline">{walletSummarySub}</p>
                <span className="wallet-card-deco" aria-hidden>
                  €
                </span>
              </div>

              <div className="wallet-fx-block">
                <h3 className="wallet-fx-heading">
                  匯率換算
                  <span className="wallet-fx-heading-sub">（幣別 → 台幣）</span>
                </h3>
                <div className="wallet-fx-top">
                  <div className="wallet-fx-top-col">
                    <span className="wallet-fx-col-title">外幣</span>
                    <select
                      className="wallet-fx-select"
                      value={fxConvCode}
                      onChange={handleFxCodeChange}
                      aria-label="外幣幣別"
                    >
                      {WALLET_FX_CODES.map((c) => (
                        <option key={c} value={c}>
                          {FX_LABELS[c]?.zh}（{c}）{FX_LABELS[c]?.sym ?? ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="wallet-fx-top-col">
                    <span className="wallet-fx-col-title">台幣（TWD）</span>
                    <div className="wallet-fx-select-mirror" aria-hidden="true" />
                  </div>
                </div>
                <div className="wallet-fx-input-row">
                  <input
                    className="wallet-fx-input"
                    inputMode="decimal"
                    value={fxConvForeign}
                    onChange={handleFxForeignInput}
                    placeholder="外幣金額"
                    aria-label="外幣金額"
                  />
                  <div className="wallet-fx-arrow-wrap" aria-hidden="true">
                    <span className="wallet-fx-arrow">→</span>
                  </div>
                  <input
                    className="wallet-fx-input"
                    inputMode="numeric"
                    value={fxConvTwd}
                    onChange={handleFxTwdInput}
                    placeholder="台幣金額"
                    aria-label="台幣金額"
                  />
                </div>
                <p className="wallet-fx-meta">
                  {formatRateLine(fxConvCode)} · 更新於 {FX_LAST_UPDATED}
                </p>
                <button
                  type="button"
                  className="wallet-fx-apply"
                  onClick={() => {
                    setWalletCurrency(fxConvCode)
                    setWalletAmount(fxConvForeign)
                  }}
                  disabled={!Number.isFinite(parseAmountInput(fxConvForeign))}
                >
                  套用至下方新增金額
                </button>
              </div>

              <form className="wallet-form wallet-form--boxed" onSubmit={handleAddWallet}>
                <div className="wallet-item-combo" ref={walletItemComboRef}>
                  <label className="wallet-form-label" id="wallet-item-label">
                    項目
                  </label>
                  <button
                    type="button"
                    className="wallet-item-combo-trigger wallet-fx-select wallet-fx-select--full"
                    aria-haspopup="listbox"
                    aria-expanded={walletItemMenuOpen}
                    aria-labelledby="wallet-item-label"
                    onClick={() => setWalletItemMenuOpen((o) => !o)}
                  >
                    <span className={walletNote ? 'wallet-item-combo-value' : 'wallet-item-combo-placeholder'}>
                      {walletNote || '請選擇項目'}
                    </span>
                    <span className="wallet-item-combo-chevron" aria-hidden>
                      ▾
                    </span>
                  </button>
                  {walletItemMenuOpen ? (
                    <div className="wallet-item-combo-panel" role="listbox" aria-label="支出項目選單">
                      {(wallet.itemLabels ?? []).map((label) => {
                        const isBuiltin = DEFAULT_WALLET_ITEM_LABELS.includes(label)
                        return (
                          <div key={label} className="wallet-item-combo-row">
                            <button
                              type="button"
                              className="wallet-item-combo-option"
                              role="option"
                              aria-selected={walletNote === label}
                              onClick={() => {
                                setWalletNote(label)
                                setWalletItemMenuOpen(false)
                              }}
                            >
                              {label}
                            </button>
                            {!isBuiltin ? (
                              <button
                                type="button"
                                className="wallet-item-combo-remove"
                                aria-label={`從選單刪除「${label}」`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (
                                    !window.confirm(
                                      `要從選單移除「${label}」嗎？已記帳的紀錄不會刪除，僅不再出現在下拉選單。`,
                                    )
                                  )
                                    return
                                  const next = removeWalletItemLabel(wallet, label)
                                  saveWallet(next)
                                  setWallet(next)
                                  if (walletNote === label) setWalletNote('')
                                }}
                              >
                                刪除
                              </button>
                            ) : null}
                          </div>
                        )
                      })}
                      <div className="wallet-item-combo-add" onPointerDown={(e) => e.stopPropagation()}>
                        <input
                          className="wallet-item-combo-add-input trip-input"
                          placeholder="在此輸入新項目"
                          value={walletItemNewDraft}
                          onChange={(e) => setWalletItemNewDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              commitNewLabelFromMenu()
                            }
                          }}
                          autoComplete="off"
                          aria-label="新增項目名稱"
                        />
                        <button
                          type="button"
                          className="wallet-item-combo-add-btn"
                          onClick={commitNewLabelFromMenu}
                          disabled={!walletItemNewDraft.trim()}
                        >
                          加入選單
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <label className="wallet-form-label" htmlFor="wallet-amt">
                  金額
                </label>
                <div className="wallet-form-amount-row">
                  <select
                    className="wallet-fx-select wallet-fx-select--form"
                    value={walletCurrency}
                    onChange={(e) => setWalletCurrency(e.target.value)}
                    aria-label="記帳幣別"
                  >
                    <option value="TWD">台幣（TWD）</option>
                    {WALLET_FX_CODES.map((c) => (
                      <option key={c} value={c}>
                        {FX_LABELS[c]?.zh}（{c}）{FX_LABELS[c]?.sym ?? ''}
                      </option>
                    ))}
                  </select>
                  <input
                    id="wallet-amt"
                    className="trip-input wallet-form-amt-input"
                    inputMode="decimal"
                    placeholder={walletCurrency === 'TWD' ? '台幣金額' : '外幣金額'}
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                  />
                </div>
                {walletCurrency !== 'TWD' && Number.isFinite(walletFormTwdPreview) ? (
                  <p className="wallet-form-preview">
                    ≈ NT$ {walletFormTwdPreview.toLocaleString('zh-TW')}（依上方參考匯率）
                  </p>
                ) : null}
                <label className="wallet-form-label" htmlFor="wallet-paid-by">
                  誰付錢
                </label>
                <select
                  id="wallet-paid-by"
                  className="wallet-fx-select wallet-fx-select--full"
                  value={walletPaidBy}
                  onChange={(e) => setWalletPaidBy(e.target.value)}
                  aria-label="誰付錢"
                >
                  {WALLET_PAYERS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="wallet-add-primary">
                  ＋ 新增支出
                </button>
              </form>

              <ul className="wallet-list">
                {dayEntries.map((e) => (
                  <li key={e.id} className="wallet-list-item">
                    <span>{formatWalletEntryDisplay(e)}</span>
                    <button type="button" className="wallet-remove" onClick={() => handleRemoveWalletEntry(e.id)}>
                      刪除
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="wallet-card wallet-card--summary wallet-card--wide">
              <p className="wallet-card-kicker">Total</p>
              <p className="wallet-card-line-title">整趟旅程累積</p>
              <p className="wallet-card-total">
                NT$ <strong>{sumAll(wallet).toLocaleString('zh-TW')}</strong>
              </p>
              <p className="wallet-card-subline">各日台幣加總 · 外幣已換算為台幣</p>
              {walletBreakdown.length === 0 ? (
                <p className="wallet-empty">尚無紀錄，切到「每日」新增支出。</p>
              ) : (
                <>
                  <ul className="wallet-breakdown">
                    {walletBreakdown.map((row) => (
                      <li key={row.id}>
                        <span>{row.label}</span>
                        <span>NT$ {row.total.toLocaleString('zh-TW')}</span>
                      </li>
                    ))}
                  </ul>
                  {walletPayerBreakdown.length > 0 ? (
                    <>
                      <p className="wallet-breakdown-kicker">依付款人（誰付錢）</p>
                      <ul className="wallet-breakdown wallet-breakdown--payers">
                        {walletPayerBreakdown.map(([payer, total]) => (
                          <li key={payer}>
                            <span>{payer}</span>
                            <span>NT$ {total.toLocaleString('zh-TW')}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'spots' && (
        <section className="panel-spots" aria-label="備用景點">
          <div className="section-head section-head--left">
            <h2 className="section-head-title">備用景點</h2>
            <span className="section-head-en">Saved</span>
          </div>
          {showSpotForm && (
            <form className="spot-form" onSubmit={handleAddSpot}>
              <label className="trip-edit-label">
                <span>名稱</span>
                <input
                  className="trip-input"
                  value={spotTitle}
                  onChange={(e) => setSpotTitle(e.target.value)}
                  placeholder="例：Daunt Books"
                  required
                />
              </label>
              <label className="trip-edit-label">
                <span>地圖連結</span>
                <input
                  className="trip-input"
                  value={spotMapUrl}
                  onChange={(e) => setSpotMapUrl(e.target.value)}
                  placeholder="選填，貼上 Google Maps 等網址"
                  autoComplete="off"
                  inputMode="url"
                />
              </label>
              <label className="trip-edit-label">
                <span>備註</span>
                <textarea
                  className="trip-input trip-textarea"
                  value={spotNote}
                  onChange={(e) => setSpotNote(e.target.value)}
                  rows={2}
                  placeholder="可留空"
                />
              </label>
              <div className="trip-edit-actions">
                <button type="button" className="btn-ghost" onClick={() => {
                  setShowSpotForm(false)
                  setSpotMapUrl('')
                  cancelEditSpot()
                }}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  儲存
                </button>
              </div>
            </form>
          )}
          <ul className="spot-list">
            {spots.spots.length === 0 && !showSpotForm ? (
              <li className="spot-empty">尚無收藏，點右下角 + 新增。</li>
            ) : null}
            {spots.spots.map((s) => (
              <li key={s.id} className="spot-card">
                {editingSpotId === s.id ? (
                  <form className="spot-card-edit" onSubmit={handleSaveSpotEdit}>
                    <label className="trip-edit-label">
                      <span>名稱</span>
                      <input
                        className="trip-input"
                        value={editSpotTitle}
                        onChange={(e) => setEditSpotTitle(e.target.value)}
                        placeholder="景點名稱"
                        required
                        autoFocus
                      />
                    </label>
                    <label className="trip-edit-label">
                      <span>地圖連結</span>
                      <input
                        className="trip-input"
                        value={editSpotMapUrl}
                        onChange={(e) => setEditSpotMapUrl(e.target.value)}
                        placeholder="選填，貼上 Google Maps 等網址"
                        autoComplete="off"
                        inputMode="url"
                      />
                    </label>
                    <label className="trip-edit-label">
                      <span>備註</span>
                      <textarea
                        className="trip-input trip-textarea"
                        value={editSpotNote}
                        onChange={(e) => setEditSpotNote(e.target.value)}
                        rows={2}
                        placeholder="可留空"
                      />
                    </label>
                    <div className="trip-edit-actions">
                      <button type="button" className="btn-ghost" onClick={cancelEditSpot}>
                        取消
                      </button>
                      <button type="submit" className="btn-primary">
                        儲存
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="spot-card-title">{s.title}</h3>
                    {s.note ? <p className="spot-card-note">{s.note}</p> : null}
                    <div className="spot-card-actions">
                      <a
                        className="trip-action-btn"
                        href={s.mapUrl?.trim() ? normalizeUserMapUrl(s.mapUrl) : googleMapsSearchUrl(s.title)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        地圖
                      </a>
                      <button type="button" className="trip-action-btn" onClick={() => beginEditSpot(s)}>
                        編輯
                      </button>
                      <button
                        type="button"
                        className="trip-action-btn"
                        onClick={() => handleAddSpotToItinerary(s)}
                      >
                        加入行程
                      </button>
                      <button type="button" className="trip-action-btn" onClick={() => handleRemoveSpot(s.id)}>
                        刪除
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
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
          className={tab === 'home' ? 'bottom-nav-item bottom-nav-item--fab bottom-nav-item--active' : 'bottom-nav-item bottom-nav-item--fab'}
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
