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
    onSuccess: (data) => {
      console.log('Cart data refetched:', data);
      if (data) {
        setItems(data.items || []);
      }
    }
  });

  // Add to cart mutation
  const addToCartMutation = api.cart.addToCart.useMutation({
    onSuccess: (data) => {
      console.log('Add to cart success:', data);
      // Update local state immediately
      if (data) {
        setItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(item => item.flowerId === data.flowerId);
          if (existingItemIndex >= 0) {
            // Update existing item
            const newItems = [...prevItems];
            newItems[existingItemIndex] = data;
            return newItems;
          } else {
            // Add new item
            return [...prevItems, data];
          }
        });
      }
      // Then refetch to ensure consistency
      refetchCart();
    },
    onError: (error) => {
      console.error('Add to cart mutation error:', error);
    }
  });

  // Remove from cart mutation
  const removeFromCartMutation = api.cart.removeFromCart.useMutation({
    onSuccess: (data) => {
      console.log('Remove from cart success:', data);
      // For deleteMany, we need to refetch since we don't know which items were deleted
      refetchCart();
    },
    onError: (error) => {
      console.error('Remove from cart mutation error:', error);
    }
  });

  // Update quantity mutation
  const updateQuantityMutation = api.cart.updateQuantity.useMutation({
    onSuccess: (data) => {
      console.log('Update quantity success:', data);
      // For updateMany, we need to refetch since we don't get the updated items
      refetchCart();
    },
    onError: (error) => {
      console.error('Update quantity mutation error:', error);
    }
  });

  // Clear cart mutation
  const clearCartMutation = api.cart.clearCart.useMutation({
    onSuccess: () => {
      console.log('Clear cart success');
      // Update local state immediately
      setItems([]);
      // Then refetch to ensure consistency
      refetchCart();
    },
    onError: (error) => {
      console.error('Clear cart mutation error:', error);
    }
  });

  // Initialize cart
  useEffect(() => {
    const initCart = async () => {
      console.log('Initializing cart...');
      try {
        const { data } = await refetchCart();
        console.log('Cart refetch result:', data);
        if (data) {
          console.log('Setting cart items:', data.items);
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initCart();
    }
  }, [isInitialized, refetchCart]);

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
