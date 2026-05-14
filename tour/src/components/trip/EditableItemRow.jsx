import { useState } from 'react'
import { mapHrefForTripItem, mapUrlFromTripItem, normalizeUserMapUrl, splitTimeForCard } from '../../utils/tripFormat.js'
import { IconNavSend, IconPencilSmall, IconTrashSmall } from '../icons/Icons.jsx'
import { LinkList } from './LinkList.jsx'

export function EditableItemRow({
  item,
  itemIndex,
  onUpdate,
  onRemove,
  layout = 'row',
  regionLabel = '',
}) {
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
