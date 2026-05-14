import { useMemo } from 'react'
import { IconCalendar } from '../icons/Icons.jsx'
import { EditableItemRow } from './EditableItemRow.jsx'
import { regionChipLabel } from '../../utils/tripFormat.js'

export function MainItineraryCard({
  variant,
  cardRef,
  current,
  tripData,
  listItems,
  showAllItems,
  hiddenCount,
  onToggleShowAll,
  onShowAll,
  onUpdateItem,
  onRemoveItem,
}) {
  const isHome = variant === 'home'
  const regionTagOptions = useMemo(
    () => (Array.isArray(tripData) ? tripData.map((r) => regionChipLabel(r)).filter(Boolean) : []),
    [tripData],
  )
  return (
    <main
      className={isHome ? 'main-card main-card--home' : 'main-card'}
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
          onClick={onToggleShowAll}
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

      {isHome && (
        <p className="main-card-home-hint">
          最上方總覽先列「本日行程內的連結」，其下為「雲端資料夾」；再往下精簡列表可點「查看全部」或「還有 … 個行程」展開。此區為完整卡片，請點各項「編輯」修改。底部「行程」為列表檢視。
        </p>
      )}

      <div className={isHome ? 'trip-list trip-list--cards' : 'trip-list'}>
        {listItems.map((item, i) => {
          const fallback = current?.region.name.split('（')[0]?.trim() ?? ''
          return (
            <EditableItemRow
              key={`${current?.day.id}-${i}`}
              item={item}
              itemIndex={i}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              layout={isHome ? 'card' : 'row'}
              regionLabel={(item.regionTag?.trim() || fallback).trim()}
              regionFallbackLabel={fallback}
              regionTagOptions={regionTagOptions}
            />
          )
        })}
      </div>

      {!showAllItems && hiddenCount > 0 && (
        <button type="button" className="more-link" onClick={onShowAll}>
          還有 {hiddenCount} 個行程
        </button>
      )}
    </main>
  )
}
