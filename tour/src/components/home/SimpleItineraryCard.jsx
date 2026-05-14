import { simplePreviewMetaLine, simplePreviewTimeLabel } from '../../utils/tripFormat.js'
import { IconCalendarSimple } from '../icons/Icons.jsx'

export function SimpleItineraryCard({
  current,
  regionShort,
  items,
  simplePreviewItems,
  simpleHiddenCount,
  simpleListExpanded,
  onToggleExpanded,
  onExpandAll,
}) {
  if (!current) return null
  return (
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
            <button type="button" className="link-quiet" onClick={onToggleExpanded}>
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
          <button type="button" className="simple-itinerary-footer" onClick={onExpandAll}>
            還有 {simpleHiddenCount} 個行程
          </button>
        ) : null}
      </div>
    </section>
  )
}
