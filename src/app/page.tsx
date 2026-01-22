"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { initTelegram, hapticImpact } from "~/utils/telegram";
import type { Flower, Category, CartItem, FilterState } from "~/types";

// Components will be created separately
import Header from "~/components/Header";
import CategoryFilter from "~/components/CategoryFilter.tsx";
import FlowerGrid from "~/components/FlowerGrid.tsx";
import CartButton from "~/components/CartButton.tsx";
import BottomNav from "~/components/BottomNav.tsx";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState<FilterState>({
    selectedCategory: "all", // Will be updated to actual "Все" category ID when categories load
    selectedAttributes: [],
  });

  // API calls
  const { data: categories, isLoading: categoriesLoading } = api.flowers.getCategories.useQuery();
  const { data: allFlowers, isLoading: flowersLoading } = api.flowers.getFlowers.useQuery();

  // Update filter to use actual "Все" category ID when categories load
  useEffect(() => {
    if (categories && filter.selectedCategory === "all") {
      const allCategory = categories.find(cat => cat.name === "Все");
      if (allCategory) {
        setFilter(prev => ({ ...prev, selectedCategory: allCategory.id }));
      }
    }
  }, [categories, filter.selectedCategory]);

  // Initialize Telegram WebApp
  useEffect(() => {
    initTelegram();
    
    // Try to authenticate user
    const telegramData = window.Telegram?.WebApp?.initData;
    if (telegramData) {
      // Parse Telegram WebApp initData to get user info
      const params = new URLSearchParams(telegramData);
      const userParam = params.get('user');
      
      if (userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          setUser({
            id: user.id.toString(),
            telegramId: user.id.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            photoUrl: user.photo_url,
          });
        } catch (error) {
          console.error('Error parsing Telegram user data:', error);
          // Fallback to mock user if parsing fails
          setUser({
            id: "1",
            telegramId: "12345",
            firstName: "Test",
            lastName: "User",
            username: "testuser",
            photoUrl: "https://via.placeholder.com/100",
          });
        }
      } else {
        // No user data in Telegram, use mock user
        setUser({
          id: "1",
          telegramId: "12345",
          firstName: "Test",
          lastName: "User",
          username: "testuser",
          photoUrl: "https://via.placeholder.com/100",
        });
      }
    } else {
      // No Telegram data, use mock user (for development)
      setUser({
        id: "1",
        telegramId: "12345",
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        photoUrl: "https://via.placeholder.com/100",
      });
    }
  }, []);

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

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.flower?.price || 0) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (flower: Flower) => {
    if (!user) return;
    
    hapticImpact('light');
    // This would call the API to add to cart
    const existingItem = cartItems.find(item => item.flowerId === flower.id);
    
    if (existingItem) {
      setCartItems(prev => 
        prev.map(item => 
          item.flowerId === flower.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems(prev => [...prev, {
        id: Date.now().toString(),
        userId: user.id,
        flowerId: flower.id,
        quantity: 1,
        flower,
      }]);
    }
  };

  const updateQuantity = (flowerId: string, quantity: number) => {
    if (quantity === 0) {
      setCartItems(prev => prev.filter(item => item.flowerId !== flowerId));
    } else {
      setCartItems(prev => 
        prev.map(item => 
          item.flowerId === flowerId 
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  if (categoriesLoading || flowersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6 pb-20">
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
          onClick={() => {
            router.push("/cart");
            hapticImpact('medium');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
