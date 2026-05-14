import { useState } from 'react'
import {
  alignRegionTagToChip,
  buildActivityTimeString,
  mapHrefForTripItem,
  mapUrlFromTripItem,
  normalizeUserMapUrl,
  parseActivityTimeParts,
  splitTimeForCard,
} from '../../utils/tripFormat.js'
import { IconNavSend, IconPencilSmall, IconTrashSmall } from '../icons/Icons.jsx'
import { LinkList } from './LinkList.jsx'

const HOUR_OPTS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** 依下拉變更更新 draft.time（開始／結束各需時＋分；清除分則一併清除時） */
function nextTimeFromParts(prevTime, updates) {
  const p = parseActivityTimeParts(prevTime)
  let next = { ...p, ...updates }
  if (updates.sh === '') next = { ...next, sm: '' }
  if (updates.eh === '') next = { ...next, em: '' }
  if (updates.sm === '') next = { ...next, sh: '' }
  if (updates.em === '') next = { ...next, eh: '' }
  if (next.sh && next.sm === '') next = { ...next, sm: '00' }
  if (next.eh && next.em === '') next = { ...next, em: '00' }
  return buildActivityTimeString(next)
}

export function EditableItemRow({
  item,
  itemIndex,
  onUpdate,
  onRemove,
  layout = 'row',
  regionLabel = '',
  regionFallbackLabel = '',
  regionTagOptions = [],
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    time: item.time ?? '',
    title: item.title,
    detail: item.detail ?? '',
    mapUrl: mapUrlFromTripItem(item),
    regionTag: alignRegionTagToChip(item.regionTag, regionTagOptions),
  })

  function openEdit() {
    setDraft({
      time: item.time ?? '',
      title: item.title,
      detail: item.detail ?? '',
      mapUrl: mapUrlFromTripItem(item),
      regionTag: alignRegionTagToChip(item.regionTag, regionTagOptions),
    })
    setEditing(true)
  }

  const hasTime = item.time && item.type !== 'stay' && item.type !== 'block'

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

  const typeTag = item.type === 'stay' ? '住宿' : item.type === 'block' ? '備註' : '活動'

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
    const tagTrim = draft.regionTag.trim()
    const patch = {
      title,
      detail: detailTrim ? detailTrim : undefined,
      mapUrl: mapTrim || '',
      regionTag: tagTrim ? tagTrim : undefined,
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
      regionTag: alignRegionTagToChip(item.regionTag, regionTagOptions),
    })
    setEditing(false)
  }

  if (editing) {
    const chips = regionTagOptions
    const cur = String(draft.regionTag ?? '').trim()
    const extras = cur && !chips.includes(cur) ? [cur] : []
    const outerClass = layout === 'card' ? cardClass : rowClass
    const tp = parseActivityTimeParts(draft.time)
    return (
      <article className={outerClass}>
        <div className={layout === 'card' ? 'trip-edit-fields trip-edit-fields--card' : 'trip-edit-fields'}>
          {item.type === 'activity' && (
            <label className="trip-edit-label">
              <span>時間</span>
              <div className="trip-time-range-editor">
                <div className="trip-time-range-editor__block">
                  <span className="trip-time-range-editor__sublabel">開始</span>
                  <div className="trip-time-range-editor__selects">
                    <select
                      className="trip-input trip-input--select trip-time-range-editor__select"
                      aria-label="開始（時）"
                      value={tp.sh}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, time: nextTimeFromParts(d.time, { sh: e.target.value }) }))
                      }
                    >
                      <option value="">時</option>
                      {HOUR_OPTS.map((h) => (
                        <option key={`sh-${h}`} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      className="trip-input trip-input--select trip-time-range-editor__select"
                      aria-label="開始（分）"
                      value={tp.sm}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, time: nextTimeFromParts(d.time, { sm: e.target.value }) }))
                      }
                      disabled={!tp.sh}
                    >
                      <option value="">分</option>
                      {MINUTE_OPTS.map((m) => (
                        <option key={`sm-${m}`} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <span className="trip-time-range-editor__sep" aria-hidden>
                  –
                </span>
                <div className="trip-time-range-editor__block">
                  <span className="trip-time-range-editor__sublabel">結束</span>
                  <div className="trip-time-range-editor__selects">
                    <select
                      className="trip-input trip-input--select trip-time-range-editor__select"
                      aria-label="結束（時）"
                      value={tp.eh}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, time: nextTimeFromParts(d.time, { eh: e.target.value }) }))
                      }
                    >
                      <option value="">時</option>
                      {HOUR_OPTS.map((h) => (
                        <option key={`eh-${h}`} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      className="trip-input trip-input--select trip-time-range-editor__select"
                      aria-label="結束（分）"
                      value={tp.em}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, time: nextTimeFromParts(d.time, { em: e.target.value }) }))
                      }
                      disabled={!tp.eh}
                    >
                      <option value="">分</option>
                      {MINUTE_OPTS.map((m) => (
                        <option key={`em-${m}`} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
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
            <span>地區標籤</span>
            <select
              className="trip-input trip-input--select"
              value={draft.regionTag}
              onChange={(e) => setDraft((d) => ({ ...d, regionTag: e.target.value }))}
            >
              <option value="">
                {regionFallbackLabel ? `沿用「${regionFallbackLabel}」` : '沿用行程地區'}
              </option>
              {chips.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {extras.map((opt) => (
                <option key={`extra-${opt}`} value={opt}>
                  {opt}（其他）
                </option>
              ))}
            </select>
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
          <button type="button" className="trip-row-edit-btn" aria-label="編輯此項目" onClick={openEdit}>
            編輯
          </button>
          <h3 className="trip-row-title">{item.title}</h3>
          {item.detail ? <p className="trip-row-detail">{item.detail}</p> : null}
          <LinkList
            links={(item.links ?? []).filter((l) => l.label !== '地圖' && l.label !== '地圖連結')}
          />
          <div className="trip-row-actions">
            <a className="trip-action-btn" href={mapBrowseHref} target="_blank" rel="noreferrer">
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
