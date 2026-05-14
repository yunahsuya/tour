import { useCallback, useEffect, useRef, useState } from 'react'
import { osmEmbedUrl, osmEmbedUrlAroundPoint, resolveLatLonForMapPreview } from '../mapUtils.js'

export function MapPage({ current, items, mapPlaces }) {
  const [mapEmbedSrc, setMapEmbedSrc] = useState(() =>
    current ? osmEmbedUrl(current.region.id) : '',
  )
  const [activePlaceKey, setActivePlaceKey] = useState(null)
  const previewAbortRef = useRef(null)

  useEffect(() => {
    if (!current) return
    previewAbortRef.current?.abort()
    setMapEmbedSrc(osmEmbedUrl(current.region.id))
    setActivePlaceKey(null)
  }, [current?.region?.id, current?.day?.id])

  const focusPlaceOnMap = useCallback((href, title, placeKey) => {
    setActivePlaceKey(placeKey)
    previewAbortRef.current?.abort()
    const ac = new AbortController()
    previewAbortRef.current = ac
    void (async () => {
      try {
        const pt = await resolveLatLonForMapPreview(href, title, ac.signal)
        if (ac.signal.aborted || !pt) return
        setMapEmbedSrc(osmEmbedUrlAroundPoint(pt.lat, pt.lon))
      } catch {
        /* 網路／中止：保留目前嵌入畫面 */
      }
    })()
  }, [])

  if (!current) {
    return <p className="panel-empty">目前沒有行程日可顯示，請確認地區篩選。</p>
  }
  return (
    <section className="panel-map" aria-label="地圖">
      <div className="map-frame-wrap">
        <iframe
          className="map-iframe"
          title="OpenStreetMap"
          src={mapEmbedSrc || osmEmbedUrl(current.region.id)}
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
          {mapPlaces.map(({ title, key, href }) => (
            <li key={key} className="map-place-row">
              <button
                type="button"
                className={
                  activePlaceKey === key ? 'map-place-focus map-place-focus--active' : 'map-place-focus'
                }
                onClick={() => focusPlaceOnMap(href, title, key)}
              >
                {title}
              </button>
              <a
                className="map-place-open-btn"
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`在新分頁開啟地圖連結：${title}`}
              >
                開啟連結
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
