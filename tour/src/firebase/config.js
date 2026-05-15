/**
 * 在專案根目錄建立 `.env`（勿提交金鑰到公開庫），填入 Vite 變數：
 * VITE_FIREBASE_API_KEY、VITE_FIREBASE_AUTH_DOMAIN、VITE_FIREBASE_PROJECT_ID、
 * VITE_FIREBASE_STORAGE_BUCKET、VITE_FIREBASE_MESSAGING_SENDER_ID、VITE_FIREBASE_APP_ID
 *
 * Firebase Console → Authentication → Sign-in method → 啟用「匿名」。
 * Firestore 規則請見專案內 `firestore.rules`。
 */
export function isFirebaseConfigured() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID,
  )
}

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}
