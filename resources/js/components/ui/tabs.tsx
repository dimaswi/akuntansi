import * as React from "react";

interface TabProps {
  label: string;
  children: React.ReactNode;
}

interface TabsProps {
  tabs: TabProps[];
  defaultIndex?: number;
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [active, setActive] = React.useState(defaultIndex);
  return (
    <div>
      <div className="flex border-b mb-4">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 -mb-px border-b-2 font-medium focus:outline-none transition-colors ${
              active === idx
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActive(idx)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].children}</div>
    </div>
  );
}
