import { parseDayLabel } from '../../dayPickerMeta.js'

export function DateStrip({
  stripRef,
  visiblePairs,
  safeIndex,
  totalDays,
  stripTotal,
  isAllDaysView,
  progressPct,
  onSelectDay,
  goPrev,
  goNext,
}) {
  return (
    <div className="date-strip-wrap">
      <div className="date-strip" ref={stripRef} role="tablist" aria-label="選擇日期">
        <button
          type="button"
          role="tab"
          aria-selected={isAllDaysView}
          data-day-idx={0}
          className={isAllDaysView ? 'date-card date-card--active date-card--all' : 'date-card date-card--all'}
          onClick={() => onSelectDay(0)}
        >
          <span className="date-card-w">ALL</span>
          <span className="date-card-d" aria-hidden>
            &nbsp;
          </span>
          <span className="date-card-n date-card-n--all">全部</span>
          <span className="date-card-m">{totalDays} 天</span>
        </button>
        {visiblePairs.map((pair, idx) => {
          const meta = parseDayLabel(pair.day.label)
          const stripIdx = idx + 1
          const active = stripIdx === safeIndex
          return (
            <button
              key={pair.day.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-day-idx={stripIdx}
              className={active ? 'date-card date-card--active' : 'date-card'}
              onClick={() => onSelectDay(stripIdx)}
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
          disabled={safeIndex >= stripTotal - 1}
        >
          ›
        </button>
      </div>
      <p className="day-progress-label">
        {isAllDaysView ? `全部 · ${totalDays} 天` : `Day ${safeIndex} / ${totalDays}`}
      </p>
    </div>
  )
}
