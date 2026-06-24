'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface IngredientResult {
  name: string;
  category: string;
  allergenZone?: number;
}

interface IngredientSearchProps {
  selectedIngredients: string[];
  onSelect: (ingredient: string) => void;
  onRemove: (ingredient: string) => void;
  label: string;
  placeholder: string;
}

export default function IngredientSearch({
  selectedIngredients,
  onSelect,
  onRemove,
  label,
  placeholder,
}: IngredientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IngredientResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchIngredients = useCallback((search: string) => {
    if (!search.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    fetch(`/api/ingredients?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data: IngredientResult[]) => {
        setResults(data);
        setIsOpen(data.length > 0);
        setActiveIndex(-1);
      })
      .catch(() => {
        setResults([]);
        setIsOpen(false);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchIngredients(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchIngredients]);

  // Group results by category
  const grouped = results.reduce<Record<string, IngredientResult[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  // Flat list for keyboard nav
  const flatResults = Object.values(grouped).flat();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : flatResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatResults.length) {
          const item = flatResults[activeIndex];
          if (!selectedIngredients.includes(item.name)) {
            onSelect(item.name);
          }
          setQuery('');
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleSelect = (name: string) => {
    if (!selectedIngredients.includes(name)) {
      onSelect(name);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  let flatIndex = -1;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            // Delay close so clicks on dropdown register
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {Object.entries(grouped).map(([category, items]) => (
              <li key={category}>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  {category}
                </div>
                {items.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const isSelected = selectedIngredients.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      role="option"
                      aria-selected={idx === activeIndex}
                      onClick={() => handleSelect(item.name)}
                      disabled={isSelected}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left',
                        idx === activeIndex && 'bg-blue-50',
                        isSelected
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <span className="flex-1">{item.name}</span>
                      {item.allergenZone !== undefined && item.allergenZone > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-xs text-amber-600"
                          title={`Allergen zone ${item.allergenZone}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3 w-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Zone {item.allergenZone}
                        </span>
                      )}
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected tags */}
      {selectedIngredients.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedIngredients.map((ingredient) => (
            <span
              key={ingredient}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => onRemove(ingredient)}
                className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-blue-200"
                aria-label={`Remove ${ingredient}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
