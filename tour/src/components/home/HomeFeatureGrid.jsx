import { IconFeatureMap, IconFeaturePlans, IconFeatureSaved, IconFeatureWallet } from '../icons/Icons.jsx'

export function HomeFeatureGrid({ onNavigate }) {
  return (
    <section className="home-grid-section" aria-label="首頁功能捷徑">
      <div className="feature-grid">
        <button type="button" className="feature-tile" onClick={() => onNavigate('itinerary')}>
          <IconFeaturePlans />
          <span className="feature-tile-title">Plans / 每日行程</span>
          <span className="feature-tile-sub">編輯時間地點與備註</span>
        </button>
        <button type="button" className="feature-tile" onClick={() => onNavigate('map')}>
          <IconFeatureMap />
          <span className="feature-tile-title">Map / 地圖導航</span>
          <span className="feature-tile-sub">當日所有地點 + 我的位置</span>
        </button>
        <button type="button" className="feature-tile" onClick={() => onNavigate('wallet')}>
          <IconFeatureWallet />
          <span className="feature-tile-title">Wallet / 記帳分帳</span>
          <span className="feature-tile-sub">自動換算為台幣</span>
        </button>
        <button type="button" className="feature-tile" onClick={() => onNavigate('spots')}>
          <IconFeatureSaved />
          <span className="feature-tile-title">Saved / 備用景點</span>
          <span className="feature-tile-sub">收藏想去的地方</span>
        </button>
      </div>
    </section>
  )
}
