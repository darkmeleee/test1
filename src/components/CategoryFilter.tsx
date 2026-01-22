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
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Категории
        </h2>
        <div className="flex flex-wrap gap-2">
          {mainCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter.selectedCategory === category.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div>
        <div className="flex flex-wrap gap-2">
          {attributeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleAttributeToggle(category.name)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter.selectedAttributes.includes(category.name)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
