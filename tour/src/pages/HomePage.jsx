import { HomeFeatureGrid } from '../components/home/HomeFeatureGrid.jsx'
import { SimpleItineraryCard } from '../components/home/SimpleItineraryCard.jsx'
import { MainItineraryCard } from '../components/trip/MainItineraryCard.jsx'

export function HomePage({
  cardRef,
  current,
  tripData,
  regionShort,
  items,
  simplePreviewItems,
  simpleHiddenCount,
  simpleListExpanded,
  onToggleSimpleExpanded,
  onExpandSimpleAll,
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
  onNavigateTab,
}) {
  return (
    <>
      <SimpleItineraryCard
        current={current}
        regionShort={regionShort}
        items={items}
        simplePreviewItems={simplePreviewItems}
        simpleHiddenCount={simpleHiddenCount}
        simpleListExpanded={simpleListExpanded}
        onToggleExpanded={onToggleSimpleExpanded}
        onExpandAll={onExpandSimpleAll}
      />
      <HomeFeatureGrid onNavigate={onNavigateTab} />
      <MainItineraryCard
        variant="home"
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
    </>
  )
}
