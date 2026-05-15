import { useState } from 'react'
import { formatShareCodeForDisplay } from '../../firebase/shareCodeUtils.js'

export function ShareSyncBar({
  firebaseEnabled,
  shareCode,
  syncReady,
  syncBusy,
  syncError,
  onCreateCode,
  onJoinCode,
  onLeaveCode,
}) {
  const [joinDraft, setJoinDraft] = useState('')
  const [copyHint, setCopyHint] = useState('')

  if (!firebaseEnabled) {
    return (
      <section className="share-sync share-sync--disabled" aria-label="跨裝置同步">
        <p className="share-sync-text">
          跨裝置同步尚未啟用（需在建置時設定 Firebase 環境變數）。目前行程、記帳、景點與行李清單僅存在此瀏覽器的{' '}
          <code className="share-sync-code">localStorage</code>。
        </p>
      </section>
    )
  }

  const displayCode = shareCode ? formatShareCodeForDisplay(shareCode) : ''
  const shareUrl =
    typeof window !== 'undefined' && shareCode
      ? `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(shareCode)}`
      : ''

  async function handleCopy() {
    if (!shareCode) return
    const text = shareUrl || shareCode
    try {
      await navigator.clipboard.writeText(text)
      setCopyHint('已複製連結')
    } catch {
      try {
        await navigator.clipboard.writeText(shareCode)
        setCopyHint('已複製代碼')
      } catch {
        setCopyHint('請手動複製代碼')
      }
    }
    window.setTimeout(() => setCopyHint(''), 2500)
  }

  function handleJoinSubmit(e) {
    e.preventDefault()
    if (onJoinCode(joinDraft)) setJoinDraft('')
  }

  if (shareCode) {
    return (
      <section
        className="share-sync share-sync-row--active"
        aria-label="跨裝置同步"
        aria-busy={syncBusy || undefined}
      >
        <p className="share-sync-hint">已加入共用行程（多裝置同步中）</p>
        <p className="share-sync-text">
          行程代碼：<strong className="share-sync-id">{displayCode}</strong>
          {syncReady ? (
            syncBusy ? (
              <> · 同步中…</>
            ) : (
              <> · 已連線雲端</>
            )
          ) : (
            <> · 連線中…</>
          )}
          {copyHint ? <> · {copyHint}</> : null}
        </p>
        <p className="share-sync-text">
          家人在其他手機／電腦輸入相同代碼，或開啟你分享的連結，即可看到同一份行程、記帳、備用景點與行李清單。知道代碼的人皆可編輯，請勿公開張貼。
        </p>
        {syncError ? (
          <p className="share-sync-text" role="alert">
            {syncError}
          </p>
        ) : null}
        <div className="share-sync-actions">
          <button type="button" className="share-sync-btn share-sync-btn--primary" onClick={handleCopy}>
            複製分享連結
          </button>
          <button type="button" className="share-sync-btn share-sync-btn--ghost" onClick={onLeaveCode}>
            離開共用
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="share-sync" aria-label="跨裝置同步">
      <p className="share-sync-hint">跨裝置同步（選用）</p>
      <p className="share-sync-text">
        建立或輸入<strong>行程代碼</strong>後，行程、記帳、備用景點與行李清單會同步到雲端；未加入代碼前，資料仍只存在本機{' '}
        <code className="share-sync-code">localStorage</code>。
      </p>
      {syncError ? (
        <p className="share-sync-text" role="alert">
          {syncError}
        </p>
      ) : null}
      <div className="share-sync-stack">
        <div className="share-sync-actions">
          <button
            type="button"
            className="share-sync-btn share-sync-btn--primary"
            disabled={!syncReady || syncBusy}
            onClick={onCreateCode}
          >
            建立新代碼
          </button>
        </div>
        <form className="share-sync-join" onSubmit={handleJoinSubmit}>
          <input
            className="share-sync-input"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="輸入家人分享的代碼"
            value={joinDraft}
            onChange={(e) => setJoinDraft(e.target.value)}
            aria-label="行程代碼"
            disabled={!syncReady || syncBusy}
          />
          <button
            type="submit"
            className="share-sync-btn"
            disabled={!syncReady || syncBusy || !joinDraft.trim()}
          >
            加入
          </button>
        </form>
      </div>
    </section>
  )
}
