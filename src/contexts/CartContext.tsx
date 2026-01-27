"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, Flower } from "~/types";

interface CartContextType {
  items: CartItem[];
  addToCart: (flower: Flower, quantity?: number) => void;
  removeFromCart: (flowerId: string) => void;
  updateQuantity: (flowerId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "seva-flowers-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        if (typeof window !== "undefined") {
          const storedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            setItems(parsedCart);
          }
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [items, isLoading]);

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.flower?.price || 0) * item.quantity,
    0
  );

  // Add item to cart
  const addToCart = (flower: Flower, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.flowerId === flower.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const newItems = [...prevItems];
        const existingItem = newItems[existingItemIndex];
        if (existingItem) {
          newItems[existingItemIndex] = {
            id: existingItem.id,
            userId: existingItem.userId,
            flowerId: existingItem.flowerId,
            quantity: existingItem.quantity + quantity,
            flower: existingItem.flower,
          };
        }
        return newItems;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${Date.now()}-${Math.random()}`,
          userId: "local",
          flowerId: flower.id,
          quantity,
          flower,
        };
        return [...prevItems, newItem];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (flowerId: string) => {
    setItems(prevItems => prevItems.filter(item => item.flowerId !== flowerId));
  };

  // Update item quantity
  const updateQuantity = (flowerId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(flowerId);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item =>
        item.flowerId === flowerId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
