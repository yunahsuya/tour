import { MainItineraryCard } from '../components/trip/MainItineraryCard.jsx'

export function ItineraryPage({
  cardRef,
  current,
  listItems,
  showAllItems,
  hiddenCount,
  onToggleShowAllItems,
  onShowAllItems,
  onUpdateItem,
  onRemoveItem,
}) {
  return (
    <MainItineraryCard
      variant="itinerary"
      cardRef={cardRef}
      current={current}
      listItems={listItems}
      showAllItems={showAllItems}
      hiddenCount={hiddenCount}
      onToggleShowAll={onToggleShowAllItems}
      onShowAll={onShowAllItems}
      onUpdateItem={onUpdateItem}
      onRemoveItem={onRemoveItem}
    />
  )
}
