import { MainItineraryCard } from '../components/trip/MainItineraryCard.jsx'

export function ItineraryPage({
  cardRef,
  current,
  tripData,
  listEntries,
  isAllDaysView,
  totalDays,
  itineraryEntryCount,
  showAllItems,
  hiddenCount,
  onToggleShowAllItems,
  onShowAllItems,
  onUpdateItem,
  onRemoveItem,
  onUpdateDay,
}) {
  return (
    <MainItineraryCard
      variant="itinerary"
      cardRef={cardRef}
      current={current}
      tripData={tripData}
      listEntries={listEntries}
      isAllDaysView={isAllDaysView}
      totalDays={totalDays}
      itineraryEntryCount={itineraryEntryCount}
      showAllItems={showAllItems}
      hiddenCount={hiddenCount}
      onToggleShowAll={onToggleShowAllItems}
      onShowAll={onShowAllItems}
      onUpdateItem={onUpdateItem}
      onRemoveItem={onRemoveItem}
      onUpdateDay={onUpdateDay}
    />
  )
}
