/** 將 Firebase 錯誤轉成使用者可讀的繁中說明 */
export function describeFirebaseSyncError(err) {
  const code = err?.code || ''
  if (code === 'permission-denied') {
    return (
      'Firestore 權限不足：請到 Firebase Console → Firestore → 規則，' +
      '貼上專案內 firestore.rules（sharedTours）並按「發布」；' +
      '另確認 Authentication 已啟用「匿名」登入。'
    )
  }
  if (code === 'unauthenticated') {
    return '尚未登入 Firebase，請重新整理頁面；並確認已啟用匿名登入。'
  }
  if (code === 'unavailable' || code === 'network-request-failed') {
    return '無法連線雲端，請檢查網路。'
  }
  return '同步失敗，請檢查網路或代碼是否正確'
}
