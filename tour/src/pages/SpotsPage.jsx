import { googleMapsSearchUrl } from '../mapUtils.js'
import { normalizeUserMapUrl } from '../utils/tripFormat.js'

export function SpotsPage({
  spots,
  showSpotForm,
  spotTitle,
  setSpotTitle,
  spotNote,
  setSpotNote,
  spotMapUrl,
  setSpotMapUrl,
  handleAddSpot,
  editingSpotId,
  editSpotTitle,
  setEditSpotTitle,
  editSpotNote,
  setEditSpotNote,
  editSpotMapUrl,
  setEditSpotMapUrl,
  handleSaveSpotEdit,
  beginEditSpot,
  cancelEditSpot,
  handleRemoveSpot,
  handleAddSpotToItinerary,
  onCancelSpotForm,
}) {
  return (
    <section className="panel-spots" aria-label="備用景點">
      <div className="section-head section-head--left">
        <h2 className="section-head-title">備用景點</h2>
        <span className="section-head-en">Saved</span>
      </div>
      {showSpotForm && (
        <form className="spot-form" onSubmit={handleAddSpot}>
          <label className="trip-edit-label">
            <span>名稱</span>
            <input
              className="trip-input"
              value={spotTitle}
              onChange={(e) => setSpotTitle(e.target.value)}
              placeholder="例：Daunt Books"
              required
            />
          </label>
          <label className="trip-edit-label">
            <span>地圖連結</span>
            <input
              className="trip-input"
              value={spotMapUrl}
              onChange={(e) => setSpotMapUrl(e.target.value)}
              placeholder="選填，貼上 Google Maps 等網址"
              autoComplete="off"
              inputMode="url"
            />
          </label>
          <label className="trip-edit-label">
            <span>備註</span>
            <textarea
              className="trip-input trip-textarea"
              value={spotNote}
              onChange={(e) => setSpotNote(e.target.value)}
              rows={2}
              placeholder="可留空"
            />
          </label>
          <div className="trip-edit-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={onCancelSpotForm}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              儲存
            </button>
          </div>
        </form>
      )}
      <ul className="spot-list">
        {spots.spots.length === 0 && !showSpotForm ? (
          <li className="spot-empty">尚無收藏，點右下角 + 新增。</li>
        ) : null}
        {spots.spots.map((s) => (
          <li key={s.id} className="spot-card">
            {editingSpotId === s.id ? (
              <form className="spot-card-edit" onSubmit={handleSaveSpotEdit}>
                <label className="trip-edit-label">
                  <span>名稱</span>
                  <input
                    className="trip-input"
                    value={editSpotTitle}
                    onChange={(e) => setEditSpotTitle(e.target.value)}
                    placeholder="景點名稱"
                    required
                    autoFocus
                  />
                </label>
                <label className="trip-edit-label">
                  <span>地圖連結</span>
                  <input
                    className="trip-input"
                    value={editSpotMapUrl}
                    onChange={(e) => setEditSpotMapUrl(e.target.value)}
                    placeholder="選填，貼上 Google Maps 等網址"
                    autoComplete="off"
                    inputMode="url"
                  />
                </label>
                <label className="trip-edit-label">
                  <span>備註</span>
                  <textarea
                    className="trip-input trip-textarea"
                    value={editSpotNote}
                    onChange={(e) => setEditSpotNote(e.target.value)}
                    rows={2}
                    placeholder="可留空"
                  />
                </label>
                <div className="trip-edit-actions">
                  <button type="button" className="btn-ghost" onClick={cancelEditSpot}>
                    取消
                  </button>
                  <button type="submit" className="btn-primary">
                    儲存
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="spot-card-title">{s.title}</h3>
                {s.note ? <p className="spot-card-note">{s.note}</p> : null}
                <div className="spot-card-actions">
                  <a
                    className="trip-action-btn"
                    href={s.mapUrl?.trim() ? normalizeUserMapUrl(s.mapUrl) : googleMapsSearchUrl(s.title)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    地圖
                  </a>
                  <button type="button" className="trip-action-btn" onClick={() => beginEditSpot(s)}>
                    編輯
                  </button>
                  <button type="button" className="trip-action-btn" onClick={() => handleAddSpotToItinerary(s)}>
                    加入行程
                  </button>
                  <button type="button" className="trip-action-btn" onClick={() => handleRemoveSpot(s.id)}>
                    刪除
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
