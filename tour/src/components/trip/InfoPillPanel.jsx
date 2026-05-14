import { tripDriveLinks } from '../../data/trip.js'
import { IconCalendarOutline } from '../icons/Icons.jsx'

export function InfoPillPanel({ dayImportantLinks }) {
  return (
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
        <p className="info-pill-section-kicker info-pill-section-kicker--secondary">雲端資料夾（整趟共用）</p>
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
  )
}
