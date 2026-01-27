"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Header from "~/components/Header";
import CategoryFilter from "~/components/CategoryFilter";
import FlowerGrid from "~/components/FlowerGrid";
import CartButton from "~/components/CartButton";
import { hapticImpact } from "~/utils/telegram";
import { useCart } from "~/contexts/CartContext";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import type { Flower, Category, FilterState } from "~/types";

// Components will be created separately
import BottomNav from "~/components/BottomNav.tsx";

export default function HomePage() {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const [filter, setFilter] = useState<FilterState>({
    selectedCategory: "all", // Will be updated to actual "Все" category ID when categories load
    selectedAttributes: [],
  });

  // Use CartContext for cart functionality
  const { addToCart, items: cartItems, totalItems: cartCount, totalPrice: cartTotal } = useCart();

  // Get categories and flowers data
  const { data: categories, isLoading: categoriesLoading } = api.flowers.getCategories.useQuery();
  const { data: allFlowers, isLoading: flowersLoading } = api.flowers.getFlowers.useQuery({
    categoryId: undefined, // Get all flowers
    attributes: [],
  });

  // Filter flowers based on selection
  const filteredFlowers = useMemo(() => {
    return allFlowers?.map(flower => ({
      ...flower,
      attributes: JSON.parse(flower.attributesJson || "[]") as string[],
    })).filter(flower => {
      // Find the "Все" category ID
      const allCategory = categories?.find(cat => cat.name === "Все");
      
      if (filter.selectedCategory === allCategory?.id || filter.selectedCategory === "all") {
        if (filter.selectedAttributes.length === 0) return true;
        return filter.selectedAttributes.some(attr => flower.attributes.includes(attr));
      }
      
      if (flower.categoryId !== filter.selectedCategory) return false;
      
      if (filter.selectedAttributes.length === 0) return true;
      return filter.selectedAttributes.some(attr => flower.attributes.includes(attr));
    }) || [];
  }, [allFlowers, filter.selectedCategory, filter.selectedAttributes, categories]);

  if (categoriesLoading || flowersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6 pb-32">
        <CategoryFilter
          categories={(categories || []) as Category[]}
          filter={filter}
          onFilterChange={setFilter}
        />
        
        <div className="mt-8">
          <FlowerGrid
            flowers={filteredFlowers as Flower[]}
            onAddToCart={addToCart}
            cartItems={cartItems}
          />
        </div>
      </main>

      {cartCount > 0 && (
        <CartButton
          count={cartCount}
          total={cartTotal}
          onClick={() => router.push("/cart")}
        />
      )}

      <BottomNav />
    </div>
  );
}
