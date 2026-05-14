import { googleMapsSearchUrl, osmEmbedUrl } from '../mapUtils.js'

export function MapPage({ current, items, mapPlaces }) {
  if (!current) {
    return <p className="panel-empty">目前沒有行程日可顯示，請確認地區篩選。</p>
  }
  return (
    <section className="panel-map" aria-label="地圖">
      <div className="map-frame-wrap">
        <iframe
          className="map-iframe"
          title="OpenStreetMap"
          src={osmEmbedUrl(current.region.id)}
          loading="lazy"
        />
      </div>
      <div className="map-quick-bar">
        <div className="map-quick-cell">
          <span className="map-quick-label">今日行程</span>
          <span className="map-quick-val">{items.length} 筆</span>
        </div>
        <div className="map-quick-cell map-quick-cell--mid">
          <span className="map-quick-label">區域</span>
          <span className="map-quick-val">{current.region.name.split('（')[0]}</span>
        </div>
        <div className="map-quick-cell">
          <span className="map-quick-label">定位</span>
          <button
            type="button"
            className="map-locate-btn"
            onClick={() => {
              if (!navigator.geolocation) {
                window.alert('此瀏覽器不支援定位')
                return
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                    '_blank',
                    'noopener,noreferrer',
                  )
                },
                () => window.alert('無法取得定位，請檢查權限'),
                { enableHighAccuracy: true, timeout: 8000 },
              )
            }}
          >
            我的位置
          </button>
        </div>
      </div>
      <div className="map-place-list">
        <p className="map-place-list-title">當日可搜地圖</p>
        <ul>
          {mapPlaces.map(({ title, key }) => (
            <li key={key}>
              <a href={googleMapsSearchUrl(title)} target="_blank" rel="noreferrer">
                {title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
