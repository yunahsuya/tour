import { HomeFeatureGrid } from '../components/home/HomeFeatureGrid.jsx'
import { SimpleItineraryCard } from '../components/home/SimpleItineraryCard.jsx'
import { MainItineraryCard } from '../components/trip/MainItineraryCard.jsx'

export function HomePage({
  cardRef,
  current,
  regionShort,
  items,
  simplePreviewItems,
  simpleHiddenCount,
  simpleListExpanded,
  onToggleSimpleExpanded,
  onExpandSimpleAll,
  listItems,
  showAllItems,
  hiddenCount,
  onToggleShowAllItems,
  onShowAllItems,
  onUpdateItem,
  onRemoveItem,
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
        listItems={listItems}
        showAllItems={showAllItems}
        hiddenCount={hiddenCount}
        onToggleShowAll={onToggleShowAllItems}
        onShowAll={onShowAllItems}
        onUpdateItem={onUpdateItem}
        onRemoveItem={onRemoveItem}
      />
    </>
  )
}
