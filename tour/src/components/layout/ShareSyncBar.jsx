export function ShareSyncBar() {
  return (
    <section className="share-sync" aria-label="資料儲存方式">
      <p className="share-sync-text">
        行程、記帳、備用景點與行李清單皆存在此瀏覽器的 <code className="share-sync-code">localStorage</code>
        ；每次成功儲存時也會更新一筆小 <code className="share-sync-code">Cookie</code> 時間戳（無法還原內容，僅作「最近有寫入」標記）。
        清除網站資料或換裝置／瀏覽器後不會自動帶過去，請自行留意備份。
      </p>
    </section>
  )
}
