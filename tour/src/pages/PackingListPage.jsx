import { useEffect, useMemo, useState } from 'react'
import { PACKING_CHECKLIST_SECTIONS, PACKING_REFERENCE_BLOCK_ORDER } from '../data/packingList.js'
import { PACKING_PROFILES } from '../constants/packingProfiles.js'
import { IconPencilSmall, IconTrashSmall } from '../components/icons/Icons.jsx'

const REF_VARIANT = {
  carryOnRules: 'sky',
  checkedRules: 'sand',
  prohibited: 'warn',
  carrySuggest: 'default',
  checkedSuggest: 'default',
  notices: 'accent',
}

export function PackingListPage({
  activeProfileId,
  onSelectProfile,
  checkedIds,
  customsBySection,
  hiddenDefaultIds,
  labelOverrides,
  referenceBlocks,
  onRefUpdateTitle,
  onRefUpdateNote,
  onRefAddBullet,
  onRefUpdateBullet,
  onRefDeleteBullet,
  onToggle,
  onClearAll,
  onAddCustom,
  onUpdateLabel,
  onDeleteItem,
}) {
  const [draftBySection, setDraftBySection] = useState({})
  const [editingItemId, setEditingItemId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    setDraftBySection({})
    setEditingItemId(null)
    setEditDraft('')
  }, [activeProfileId])

  const sectionsRows = useMemo(() => {
    return PACKING_CHECKLIST_SECTIONS.map((sec) => {
      const defaults = sec.items
        .filter((it) => !hiddenDefaultIds.has(it.id))
        .map((it) => ({
          ...it,
          label: labelOverrides[it.id] ?? it.label,
          isCustom: false,
        }))
      const customs = (customsBySection[sec.id] ?? []).map((it) => ({ ...it, isCustom: true }))
      return { sec, rows: [...defaults, ...customs] }
    })
  }, [customsBySection, hiddenDefaultIds, labelOverrides])

  const { total, done } = useMemo(() => {
    const ids = new Set()
    let n = 0
    for (const { rows } of sectionsRows) {
      n += rows.length
      for (const r of rows) ids.add(r.id)
    }
    let d = 0
    for (const id of checkedIds) {
      if (ids.has(id)) d += 1
    }
    return { total: n, done: d }
  }, [sectionsRows, checkedIds])

  function submitDraft(sectionId) {
    const text = (draftBySection[sectionId] ?? '').trim()
    if (!text) {
      window.alert('請輸入項目名稱')
      return
    }
    onAddCustom(sectionId, text)
    setDraftBySection((prev) => ({ ...prev, [sectionId]: '' }))
  }

  function startEditItem(it) {
    setEditingItemId(it.id)
    setEditDraft(it.label)
  }

  function cancelEditItem() {
    setEditingItemId(null)
    setEditDraft('')
  }

  function saveEditItem(sec, it) {
    const text = editDraft.trim()
    if (!text) {
      window.alert('項目名稱不能為空，若要刪除請用刪除鈕。')
      return
    }
    onUpdateLabel(sec.id, it.id, it.isCustom, text)
    cancelEditItem()
  }

  return (
    <section className="panel-packing" aria-label="行李清單">
      <div className="section-head section-head--left">
        <h2 className="section-head-title">出國行李清單</h2>
        <span className="section-head-en">Packing</span>
      </div>

      <div className="segment packing-profiles" role="tablist" aria-label="選擇家庭成員">
        {PACKING_PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activeProfileId === p.id}
            className={
              activeProfileId === p.id ? 'segment-btn segment-btn--on packing-profile-tab' : 'segment-btn packing-profile-tab'
            }
            onClick={() => onSelectProfile(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="packing-progress" aria-live="polite">
        <span className="packing-progress-who">
          {PACKING_PROFILES.find((p) => p.id === activeProfileId)?.label ?? ''}
        </span>
        ：已勾選 <strong>{done}</strong>／{total} 項
      </p>

      <div className="packing-alert" role="alert">
        <p className="packing-alert-title">行動電源與鋰電池</p>
        <p className="packing-alert-body">
          「行動電源」或「鋰電池」不可託運，必須隨身攜帶。請依航空公司與機場公告包裝與保護。
        </p>
      </div>

      <div className="packing-toolbar">
        <button type="button" className="trip-action-btn" onClick={onClearAll}>
          清除所有勾選
        </button>
      </div>

      {sectionsRows.map(({ sec, rows }) => (
        <article key={sec.id} className="packing-card">
          <h3 className="packing-card-title">{sec.title}</h3>
          <ul className="packing-list">
            {rows.map((it) => {
              const on = checkedIds.has(it.id)
              const isEditing = editingItemId === it.id
              return (
                <li key={it.id} className="packing-row">
                  {isEditing ? (
                    <div className="packing-row-edit">
                      <input
                        type="text"
                        className="packing-row-edit-input"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveEditItem(sec, it)
                          }
                          if (e.key === 'Escape') cancelEditItem()
                        }}
                        maxLength={200}
                        aria-label="編輯項目名稱"
                        autoFocus
                      />
                      <div className="packing-row-edit-actions">
                        <button type="button" className="packing-ref-mini-btn" onClick={() => saveEditItem(sec, it)}>
                          儲存
                        </button>
                        <button
                          type="button"
                          className="packing-ref-mini-btn packing-ref-mini-btn--ghost"
                          onClick={cancelEditItem}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="packing-row-main">
                    <label className="packing-check-label">
                      <input
                        type="checkbox"
                        className="packing-check"
                        checked={on}
                        onChange={() => onToggle(it.id)}
                      />
                      <span className={on ? 'packing-label packing-label--done' : 'packing-label'}>{it.label}</span>
                    </label>
                      <div className="packing-row-actions">
                        <button
                          type="button"
                          className="packing-row-btn"
                          aria-label={`編輯「${it.label}」`}
                          onClick={() => startEditItem(it)}
                        >
                          <IconPencilSmall />
                        </button>
                        <button
                          type="button"
                          className="packing-row-btn packing-row-btn--danger"
                          aria-label={`刪除「${it.label}」`}
                          onClick={() => {
                            if (window.confirm(`要刪除「${it.label}」嗎？`)) onDeleteItem(sec.id, it.id, it.isCustom)
                          }}
                        >
                          <IconTrashSmall />
                        </button>
                      </div>
                  </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="packing-add">
            <input
              type="text"
              className="packing-add-input"
              value={draftBySection[sec.id] ?? ''}
              onChange={(e) => setDraftBySection((p) => ({ ...p, [sec.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitDraft(sec.id)
                }
              }}
              placeholder="新增自訂項目…"
              maxLength={200}
              aria-label={`在「${sec.title}」新增項目`}
            />
            <button type="button" className="packing-add-btn" onClick={() => submitDraft(sec.id)}>
              新增
            </button>
          </div>
        </article>
      ))}

      {PACKING_REFERENCE_BLOCK_ORDER.map((blockKey) => (
        <EditableRefBlock
          key={blockKey}
          blockKey={blockKey}
          block={referenceBlocks[blockKey]}
          variant={REF_VARIANT[blockKey] ?? 'default'}
          onUpdateTitle={onRefUpdateTitle}
          onUpdateNote={onRefUpdateNote}
          onAddBullet={onRefAddBullet}
          onUpdateBullet={onRefUpdateBullet}
          onDeleteBullet={onRefDeleteBullet}
        />
      ))}
    </section>
  )
}

function EditableRefBlock({
  blockKey,
  block,
  variant,
  onUpdateTitle,
  onUpdateNote,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
}) {
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(block?.title ?? '')
  const [noteEditing, setNoteEditing] = useState(false)
  const [noteDraft, setNoteDraft] = useState(block?.note ?? '')
  const [bulletEditId, setBulletEditId] = useState(null)
  const [bulletDraft, setBulletDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')

  useEffect(() => {
    setTitleDraft(block?.title ?? '')
    setNoteDraft(block?.note ?? '')
  }, [block?.title, block?.note])

  useEffect(() => {
    if (bulletEditId && !block?.bullets.some((x) => x.id === bulletEditId)) {
      setBulletEditId(null)
      setBulletDraft('')
    }
  }, [block?.bullets, bulletEditId])

  if (!block) return null

  function saveTitle() {
    onUpdateTitle(blockKey, titleDraft)
    setTitleEditing(false)
  }

  function saveNote() {
    onUpdateNote(blockKey, noteDraft)
    setNoteEditing(false)
  }

  function startEditBullet(b) {
    setBulletEditId(b.id)
    setBulletDraft(b.text)
  }

  function saveBullet() {
    if (!bulletEditId) return
    const t = bulletDraft.trim()
    if (!t) {
      window.alert('備註內容不能為空，若要刪除請用刪除鈕。')
      return
    }
    onUpdateBullet(blockKey, bulletEditId, t)
    setBulletEditId(null)
    setBulletDraft('')
  }

  function cancelBulletEdit() {
    setBulletEditId(null)
    setBulletDraft('')
  }

  function submitNewBullet() {
    const t = newDraft.trim()
    if (!t) {
      window.alert('請輸入備註內容')
      return
    }
    onAddBullet(blockKey, t)
    setNewDraft('')
  }

  return (
    <article className={`packing-ref packing-ref--${variant}`}>
      <div className="packing-ref-head">
        {titleEditing ? (
          <div className="packing-ref-meta-edit">
            <input
              type="text"
              className="packing-ref-title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              maxLength={200}
              aria-label="區塊標題"
            />
            <div className="packing-ref-meta-actions">
              <button type="button" className="packing-ref-mini-btn" onClick={saveTitle}>
                儲存
              </button>
              <button
                type="button"
                className="packing-ref-mini-btn packing-ref-mini-btn--ghost"
                onClick={() => {
                  setTitleDraft(block.title)
                  setTitleEditing(false)
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="packing-ref-title-row">
            <h3 className="packing-ref-title">{block.title}</h3>
            <button
              type="button"
              className="packing-ref-icon-btn"
              aria-label="編輯標題"
              onClick={() => setTitleEditing(true)}
            >
              <IconPencilSmall />
            </button>
          </div>
        )}
      </div>

      <div className="packing-ref-note-wrap">
        {noteEditing ? (
          <div className="packing-ref-meta-edit">
            <textarea
              className="packing-ref-note-input"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              maxLength={1000}
              aria-label="區塊說明"
            />
            <div className="packing-ref-meta-actions">
              <button type="button" className="packing-ref-mini-btn" onClick={saveNote}>
                儲存
              </button>
              <button
                type="button"
                className="packing-ref-mini-btn packing-ref-mini-btn--ghost"
                onClick={() => {
                  setNoteDraft(block.note ?? '')
                  setNoteEditing(false)
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="packing-ref-note-row">
            {block.note ? <p className="packing-ref-note">{block.note}</p> : <p className="packing-ref-note packing-ref-note--empty">（無說明文字，可點編輯補充）</p>}
            <button
              type="button"
              className="packing-ref-icon-btn"
              aria-label="編輯說明"
              onClick={() => setNoteEditing(true)}
            >
              <IconPencilSmall />
            </button>
          </div>
        )}
      </div>

      <ul className="packing-ref-ul packing-ref-ul--editable">
        {block.bullets.map((b) => (
          <li key={b.id} className="packing-ref-li">
            {bulletEditId === b.id ? (
              <div className="packing-ref-bullet-edit">
                <textarea
                  className="packing-ref-bullet-textarea"
                  value={bulletDraft}
                  onChange={(e) => setBulletDraft(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  aria-label="編輯備註"
                />
                <div className="packing-ref-bullet-actions">
                  <button type="button" className="packing-ref-mini-btn" onClick={saveBullet}>
                    儲存
                  </button>
                  <button type="button" className="packing-ref-mini-btn packing-ref-mini-btn--ghost" onClick={cancelBulletEdit}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="packing-ref-bullet-row">
                <span className="packing-ref-bullet-text">{b.text}</span>
                <div className="packing-ref-bullet-btns">
                  <button
                    type="button"
                    className="packing-ref-icon-btn"
                    aria-label="編輯此則備註"
                    onClick={() => startEditBullet(b)}
                  >
                    <IconPencilSmall />
                  </button>
                  <button
                    type="button"
                    className="packing-ref-icon-btn packing-ref-icon-btn--danger"
                    aria-label="刪除此則備註"
                    onClick={() => {
                      if (window.confirm('要刪除此則備註嗎？')) onDeleteBullet(blockKey, b.id)
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

      <div className="packing-ref-add">
        <textarea
          className="packing-ref-add-textarea"
          value={newDraft}
          onChange={(e) => setNewDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              submitNewBullet()
            }
          }}
          placeholder="新增一則備註…（Ctrl+Enter 送出）"
          rows={2}
          maxLength={1500}
          aria-label="新增備註"
        />
        <button type="button" className="packing-ref-add-submit" onClick={submitNewBullet}>
          新增備註
        </button>
      </div>
    </article>
  )
}
