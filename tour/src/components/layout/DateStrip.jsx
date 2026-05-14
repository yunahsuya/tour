import { parseDayLabel } from '../../dayPickerMeta.js'

export function DateStrip({
  stripRef,
  visiblePairs,
  safeIndex,
  totalDays,
  progressPct,
  onSelectDay,
  goPrev,
  goNext,
}) {
  return (
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
              onClick={() => onSelectDay(idx)}
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
  )
}
