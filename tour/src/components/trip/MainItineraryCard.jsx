import { useMemo } from 'react'
import { IconCalendar } from '../icons/Icons.jsx'
import { EditableDaySubline } from './EditableDaySubline.jsx'
import { EditableItemRow } from './EditableItemRow.jsx'
import { regionChipLabel } from '../../utils/tripFormat.js'

export function MainItineraryCard({
  variant,
  cardRef,
  current,
  tripData,
  listEntries,
  isAllDaysView,
  totalDays,
  itineraryEntryCount,
  showAllItems,
  hiddenCount,
  onToggleShowAll,
  onShowAll,
  onUpdateItem,
  onRemoveItem,
  onUpdateDay,
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
          <h2 className="main-card-title">{isAllDaysView ? '全部行程' : '今日行程'}</h2>
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

      {isAllDaysView ? (
        <p className="main-card-all-sub">
          共 {totalDays} 天 · {itineraryEntryCount} 個行程
        </p>
      ) : (
        current && (
          <EditableDaySubline
            flag={current.region.flag}
            label={current.day.label}
            subtitle={current.day.subtitle}
            onUpdate={onUpdateDay}
          />
        )
      )}

      {isHome && (
        <p className="main-card-home-hint">
          最上方總覽先列「本日行程內的連結」，其下為「雲端資料夾」；再往下精簡列表可點「查看全部」或「還有 … 個行程」展開。此區為完整卡片，請點各項「編輯」修改。底部「行程」為列表檢視。
        </p>
      )}

      <div className={isHome ? 'trip-list trip-list--cards' : 'trip-list'}>
        {listEntries.map((entry) => {
          const { item, region, day, itemIndex } = entry
          const fallback = region.name.split('（')[0]?.trim() ?? ''
          const regionLabel = (item.regionTag?.trim() || fallback).trim()
          return (
            <EditableItemRow
              key={`${day.id}-${itemIndex}`}
              item={item}
              itemIndex={itemIndex}
              onUpdate={(_, patch) => onUpdateItem(entry, patch)}
              onRemove={(_idx) => onRemoveItem(entry)}
              layout={isHome ? 'card' : 'row'}
              regionLabel={regionLabel}
              regionFallbackLabel={fallback}
              regionTagOptions={regionTagOptions}
              dayLabel={day.label}
              dayId={day.id}
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
