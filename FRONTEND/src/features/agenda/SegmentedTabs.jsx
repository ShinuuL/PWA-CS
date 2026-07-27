export default function SegmentedTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="segmented-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`segmented-tabs__tab ${activeTab === tab.id ? 'segmented-tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
