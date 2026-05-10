"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-yellow text-bg-primary font-semibold"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
