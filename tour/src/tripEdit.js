import { sortDayItemsChronologically } from './utils/tripFormat.js'

export function updateItemInTrip(trip, regionId, dayId, itemIndex, patch) {
  return trip.map((region) => {
    if (region.id !== regionId) return region
    return {
      ...region,
      days: region.days.map((day) => {
        if (day.id !== dayId) return day
        const nextItems = day.items.map((it, i) => (i === itemIndex ? { ...it, ...patch } : it))
        return {
          ...day,
          items: sortDayItemsChronologically(nextItems),
        }
      }),
    }
  })
}

export function appendItemToTrip(trip, regionId, dayId, newItem) {
  return trip.map((region) => {
    if (region.id !== regionId) return region
    return {
      ...region,
      days: region.days.map((day) =>
        day.id !== dayId ? day : { ...day, items: sortDayItemsChronologically([...day.items, newItem]) },
      ),
    }
  })
}

export function removeItemFromTrip(trip, regionId, dayId, itemIndex) {
  return trip.map((region) => {
    if (region.id !== regionId) return region
    return {
      ...region,
      days: region.days.map((day) => {
        if (day.id !== dayId) return day
        return { ...day, items: day.items.filter((_, i) => i !== itemIndex) }
      }),
    }
  })
}
