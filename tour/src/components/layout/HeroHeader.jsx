import { IconGear } from '../icons/Icons.jsx'

export function HeroHeader({ tripData, filter, onResetTrip, onFilterChange }) {
  return (
    <header className="hero">
      <button type="button" className="hero-settings" aria-label="重設為預設行程" onClick={onResetTrip}>
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
              onClick={() => onFilterChange(id)}
            >
              {label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
