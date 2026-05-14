export function googleMapsSearchUrl(query) {
  const q = (query ?? '').trim() || 'London'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** @param {string | undefined} regionId */
export function osmEmbedUrl(regionId) {
  if (regionId === 'barcelona') {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=2.05%2C41.35%2C2.23%2C41.45&layer=mapnik'
  }
  if (regionId === 'london') {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=-0.18%2C51.47%2C0.06%2C51.54&layer=mapnik'
  }
  return 'https://www.openstreetmap.org/export/embed.html?bbox=-0.12%2C41.36%2C2.2%2C51.55&layer=mapnik'
}
