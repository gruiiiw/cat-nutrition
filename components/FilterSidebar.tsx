'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface Filters {
  foodType: 'wet' | 'dry' | 'both';
  minProtein: number;
  maxCarbs: number;
  lifeStages: string[];
  textures: string[];
  minBudget: number;
  maxBudget: number;
  brands: string[];
}

interface FilterSidebarProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Partial<Filters>;
}

const LIFE_STAGES = ['kitten', 'adult', 'senior', 'all stages'];
const TEXTURES = ['pate', 'shreds', 'chunks', 'minced', 'morsels', 'flaked'];

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-sm font-medium text-gray-900"
      >
        {title}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

const DEFAULT_FILTERS: Filters = {
  foodType: 'both',
  minProtein: 0,
  maxCarbs: 100,
  lifeStages: [],
  textures: [],
  minBudget: 0,
  maxBudget: 20,
  brands: [],
};

export default function FilterSidebar({
  onFilterChange,
  initialFilters,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [brandSearch, setBrandSearch] = useState('');
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    setLoadingBrands(true);
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data: string[]) => setAvailableBrands(data))
      .catch(() => setAvailableBrands([]))
      .finally(() => setLoadingBrands(false));
  }, []);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange]
  );

  const toggleArrayItem = useCallback(
    (key: 'lifeStages' | 'textures' | 'brands', item: string) => {
      setFilters((prev) => {
        const arr = prev[key];
        const next = {
          ...prev,
          [key]: arr.includes(item)
            ? arr.filter((i) => i !== item)
            : [...arr, item],
        };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange]
  );

  const filteredBrands = availableBrands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <div className="w-full space-y-0">
      {/* Food Type */}
      <CollapsibleSection title="Food Type">
        {(['wet', 'dry', 'both'] as const).map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="foodType"
              checked={filters.foodType === type}
              onChange={() => updateFilter('foodType', type)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="capitalize">{type}</span>
          </label>
        ))}
      </CollapsibleSection>

      {/* Protein (DMB) */}
      <CollapsibleSection title="Protein (DMB)">
        <label className="text-xs text-gray-500">Minimum %</label>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.minProtein}
          onChange={(e) => updateFilter('minProtein', Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </CollapsibleSection>

      {/* Carbs (DMB) */}
      <CollapsibleSection title="Carbs (DMB)">
        <label className="text-xs text-gray-500">Maximum %</label>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.maxCarbs}
          onChange={(e) => updateFilter('maxCarbs', Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </CollapsibleSection>

      {/* Life Stage */}
      <CollapsibleSection title="Life Stage">
        {LIFE_STAGES.map((stage) => (
          <label key={stage} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filters.lifeStages.includes(stage)}
              onChange={() => toggleArrayItem('lifeStages', stage)}
              className="h-4 w-4 rounded text-blue-600"
            />
            <span className="capitalize">{stage}</span>
          </label>
        ))}
      </CollapsibleSection>

      {/* Texture */}
      <CollapsibleSection title="Texture">
        {TEXTURES.map((texture) => (
          <label key={texture} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filters.textures.includes(texture)}
              onChange={() => toggleArrayItem('textures', texture)}
              className="h-4 w-4 rounded text-blue-600"
            />
            <span className="capitalize">{texture}</span>
          </label>
        ))}
      </CollapsibleSection>

      {/* Budget */}
      <CollapsibleSection title="Budget ($/day)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={0.5}
            value={filters.minBudget}
            onChange={(e) => updateFilter('minBudget', Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            placeholder="Min"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={filters.maxBudget}
            onChange={(e) => updateFilter('maxBudget', Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            placeholder="Max"
          />
        </div>
      </CollapsibleSection>

      {/* Brand */}
      <CollapsibleSection title="Brand">
        <input
          type="text"
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          placeholder="Search brands..."
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
          {loadingBrands ? (
            <p className="text-xs text-gray-400">Loading brands...</p>
          ) : (
            filteredBrands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleArrayItem('brands', brand)}
                  className="h-4 w-4 rounded text-blue-600"
                />
                {brand}
              </label>
            ))
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
