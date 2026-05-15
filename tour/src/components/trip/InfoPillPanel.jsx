import { useState } from 'react'
import { tripDriveLinks } from '../../data/trip.js'
import { IconCalendarOutline, IconPencilSmall, IconTrashSmall } from '../icons/Icons.jsx'

function DriveLinkFields({ label, setLabel, href, setHref, from, setFrom }) {
  return (
    <>
      <label className="trip-edit-label">
        <span>名稱</span>
        <input
          className="trip-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="例：保險單"
          maxLength={120}
          required
        />
      </label>
      <label className="trip-edit-label">
        <span>連結網址</span>
        <input
          className="trip-input"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="Google Drive / 試算表網址"
          autoComplete="off"
          inputMode="url"
          required
        />
      </label>
      <label className="trip-edit-label">
        <span>來源說明</span>
        <input
          className="trip-input"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Google Drive"
          maxLength={80}
        />
      </label>
    </>
  )
}

export function InfoPillPanel({
  dayImportantLinks,
  customDriveLinks,
  onAddDriveLink,
  onUpdateDriveLink,
  onRemoveDriveLink,
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLabel, setAddLabel] = useState('')
  const [addHref, setAddHref] = useState('')
  const [addFrom, setAddFrom] = useState('Google Drive')
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [editHref, setEditHref] = useState('')
  const [editFrom, setEditFrom] = useState('')

  function resetAddForm() {
    setAddLabel('')
    setAddHref('')
    setAddFrom('Google Drive')
    setShowAddForm(false)
  }

  function startEdit(link) {
    setEditingId(link.id)
    setEditLabel(link.label)
    setEditHref(link.href)
    setEditFrom(link.from ?? 'Google Drive')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditLabel('')
    setEditHref('')
    setEditFrom('')
  }

  function handleAddSubmit(e) {
    e.preventDefault()
    const href = addHref.trim()
    if (!href) return
    onAddDriveLink({
      label: addLabel.trim() || '未命名連結',
      href,
      from: addFrom.trim() || 'Google Drive',
    })
    resetAddForm()
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingId) return
    const href = editHref.trim()
    if (!href) return
    onUpdateDriveLink(editingId, {
      label: editLabel.trim() || '未命名連結',
      href,
      from: editFrom.trim() || 'Google Drive',
    })
    cancelEdit()
  }

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

        <div className="info-pill-drive-head">
          <p className="info-pill-section-kicker info-pill-section-kicker--secondary info-pill-section-kicker--inline">
            雲端資料夾（整趟共用）
          </p>
          {!showAddForm && (
            <button
              type="button"
              className="info-pill-drive-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              ＋ 新增
            </button>
          )}
        </div>

        <ul className="info-pill-link-list info-pill-link-list--drive">
          {tripDriveLinks.map((link) => (
            <li key={link.href} className="info-pill-drive-row info-pill-drive-row--builtin">
              <a href={link.href} target="_blank" rel="noreferrer noopener">
                {link.label}
              </a>
              <span className="info-pill-link-from">{link.from ?? 'Google Drive'}</span>
            </li>
          ))}
          {customDriveLinks.links.map((link) => (
            <li key={link.id} className="info-pill-drive-row info-pill-drive-row--custom">
              {editingId === link.id ? (
                <form className="info-pill-drive-form" onSubmit={handleEditSubmit}>
                  <DriveLinkFields
                    label={editLabel}
                    setLabel={setEditLabel}
                    href={editHref}
                    setHref={setEditHref}
                    from={editFrom}
                    setFrom={setEditFrom}
                  />
                  <div className="trip-edit-actions">
                    <button type="button" className="btn-ghost" onClick={cancelEdit}>
                      取消
                    </button>
                    <button type="submit" className="btn-primary">
                      儲存
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-pill-drive-custom">
                  <div className="info-pill-drive-custom-main">
                    <a href={link.href} target="_blank" rel="noreferrer noopener">
                      {link.label}
                    </a>
                    <span className="info-pill-link-from">{link.from ?? 'Google Drive'}</span>
                  </div>
                  <div className="info-pill-drive-actions">
                    <button
                      type="button"
                      className="info-pill-drive-icon-btn"
                      aria-label={`編輯「${link.label}」`}
                      onClick={() => startEdit(link)}
                    >
                      <IconPencilSmall />
                    </button>
                    <button
                      type="button"
                      className="info-pill-drive-icon-btn info-pill-drive-icon-btn--danger"
                      aria-label={`刪除「${link.label}」`}
                      onClick={() => {
                        if (window.confirm(`要刪除「${link.label}」嗎？`)) onRemoveDriveLink(link.id)
                      }}
                    >
                      <IconTrashSmall />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {showAddForm ? (
          <form className="info-pill-drive-form info-pill-drive-form--add" onSubmit={handleAddSubmit}>
            <DriveLinkFields
              label={addLabel}
              setLabel={setAddLabel}
              href={addHref}
              setHref={setAddHref}
              from={addFrom}
              setFrom={setAddFrom}
            />
            <div className="trip-edit-actions">
              <button type="button" className="btn-ghost" onClick={resetAddForm}>
                取消
              </button>
              <button type="submit" className="btn-primary">
                新增
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  )
}
