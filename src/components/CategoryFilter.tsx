import { useCallback } from "react";
import type { Category, FilterState } from "~/types";

interface CategoryFilterProps {
  categories: Category[];
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

export default function CategoryFilter({ categories, filter, onFilterChange }: CategoryFilterProps) {
  const mainCategories = categories.filter(cat => cat.type === "MAIN");
  const attributeCategories = categories.filter(cat => cat.type === "ATTRIBUTE");

  const handleCategoryChange = useCallback((categoryId: string) => {
    onFilterChange({
      ...filter,
      selectedCategory: categoryId,
      selectedAttributes: [], // Reset attributes when category changes
    });
  }, [filter, onFilterChange]);

  const handleAttributeToggle = useCallback((attributeId: string) => {
    const newAttributes = filter.selectedAttributes.includes(attributeId)
      ? filter.selectedAttributes.filter(id => id !== attributeId)
      : [attributeId]; // Only allow one attribute at a time

    onFilterChange({
      ...filter,
      selectedAttributes: newAttributes,
    });
  }, [filter, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Main Categories */}
      <div>
        <div className="flex flex-wrap gap-2">
          {mainCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter.selectedCategory === category.id
                  ? "bg-brand-600 text-white"
                  : "bg-brand-100 text-ink-700 hover:bg-brand-200 dark:bg-ink-700 dark:text-ink-200 dark:hover:bg-ink-600"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div>
        <div className="h-px w-full bg-brand-200 dark:bg-ink-700" />
        <div className="mt-3 flex flex-wrap gap-2">
          {attributeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleAttributeToggle(category.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                filter.selectedAttributes.includes(category.id)
                  ? "bg-ink-900 text-white border-ink-900 dark:bg-white dark:text-ink-900 dark:border-white"
                  : "bg-white text-ink-700 border-brand-200 hover:bg-brand-50 dark:bg-ink-800 dark:text-ink-200 dark:border-ink-700 dark:hover:bg-ink-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
