"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "~/trpc/react";
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from API
  const { data: cartData, refetch: refetchCart } = api.cart.getUserCart.useQuery(undefined, {
    enabled: false, // We'll trigger this manually
  });

  // Add to cart mutation
  const addToCartMutation = api.cart.addToCart.useMutation({
    onSuccess: () => refetchCart(),
  });

  // Remove from cart mutation
  const removeFromCartMutation = api.cart.removeFromCart.useMutation({
    onSuccess: () => refetchCart(),
  });

  // Update quantity mutation
  const updateQuantityMutation = api.cart.updateQuantity.useMutation({
    onSuccess: () => refetchCart(),
  });

  // Clear cart mutation
  const clearCartMutation = api.cart.clearCart.useMutation({
    onSuccess: () => refetchCart(),
  });

  // Initialize cart
  useEffect(() => {
    const initCart = async () => {
      try {
        const { data } = await refetchCart();
        if (data) {
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initCart();
  }, []);

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.flower?.price || 0) * item.quantity,
    0
  );

  // Add item to cart
  const addToCart = async (flower: Flower, quantity: number = 1) => {
    try {
      await addToCartMutation.mutateAsync({
        flowerId: flower.id,
        quantity,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (flowerId: string) => {
    try {
      await removeFromCartMutation.mutateAsync({ flowerId });
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (flowerId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(flowerId);
      return;
    }

    try {
      await updateQuantityMutation.mutateAsync({
        flowerId,
        quantity,
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
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
