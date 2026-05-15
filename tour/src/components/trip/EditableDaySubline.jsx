import { useState } from 'react'
import { IconPencilSmall } from '../icons/Icons.jsx'

export function EditableDaySubline({ flag, label, subtitle, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ label: label ?? '', subtitle: subtitle ?? '' })

  function openEdit() {
    setDraft({ label: label ?? '', subtitle: subtitle ?? '' })
    setEditing(true)
  }

  function cancel() {
    setDraft({ label: label ?? '', subtitle: subtitle ?? '' })
    setEditing(false)
  }

  function commit() {
    const trimmedLabel = draft.label.trim()
    if (!trimmedLabel) {
      window.alert('請輸入日期')
      return
    }
    onUpdate({
      label: trimmedLabel,
      subtitle: draft.subtitle.trim() || undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="main-card-sub main-card-sub--editing" role="group" aria-label="編輯日期">
        <div className="trip-edit-fields trip-edit-fields--day-sub">
          <label className="trip-edit-label">
            <span>日期</span>
            <input
              className="trip-input"
              type="text"
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              placeholder="例：5/15（四）"
              autoFocus
            />
          </label>
          <label className="trip-edit-label">
            <span>副標</span>
            <input
              className="trip-input"
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
              placeholder="例：桃園過境（可留空）"
            />
          </label>
          <div className="trip-edit-actions">
            <button type="button" className="btn-ghost" onClick={cancel}>
              取消
            </button>
            <button type="button" className="btn-primary" onClick={commit}>
              完成
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <p className="main-card-sub main-card-sub--editable">
      <span className="main-card-sub-text">
        {flag} {label}
        {subtitle ? ` · ${subtitle}` : ''}
      </span>
      <button type="button" className="main-card-sub-edit" onClick={openEdit} aria-label="編輯日期與副標">
        <IconPencilSmall />
        編輯
      </button>
    </p>
  )
}
