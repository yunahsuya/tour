import { MainItineraryCard } from '../components/trip/MainItineraryCard.jsx'

export function ItineraryPage({
  cardRef,
  current,
  tripData,
  listItems,
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
      listItems={listItems}
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
