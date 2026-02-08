"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, Order, OrderItem } from "~/types";
import { useCart } from "./CartContext";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { useToast } from "~/hooks/useToast";
import { api } from "~/trpc/react";

interface OrderContextType {
  orders: Order[];
  createOrder: (orderData: {
    deliveryMethod?: "DELIVERY" | "PICKUP";
    deliveryAddress?: string;
    phoneNumber?: string;
    notes?: string;
  }) => Promise<Order | null>;
  getOrder: (id: string) => Order | undefined;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = "seva-flowers-orders";
const CART_STORAGE_KEY = "seva-flowers-cart";

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { items: cartItems, clearCart } = useCart();
  const { user } = useTelegramAuth();
  const { showToast } = useToast();
  const createOrderMutation = api.orders.createOrder.useMutation();

  // Load orders from localStorage
  useEffect(() => {
    const loadOrders = () => {
      try {
        if (typeof window !== "undefined") {
          const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
          if (storedOrders) {
            const parsedOrders = JSON.parse(storedOrders);
            setOrders(parsedOrders);
          }
        }
      } catch (error) {
        // Silent error
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        }
      } catch (error) {
        // Silent error
      }
    }
  }, [orders, isLoading]);

  // Create order from cart
  const createOrder = async (orderData: {
    deliveryMethod?: "DELIVERY" | "PICKUP";
    deliveryAddress?: string;
    phoneNumber?: string;
    notes?: string;
  }): Promise<Order | null> => {
    try {
      if (!user || user.id === user.telegramId) {
        showToast("Авторизация не завершена. Подождите...", "error");
        return null;
      }

      let itemsForOrder: CartItem[] = cartItems;
      try {
        if (typeof window !== "undefined") {
          const storedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            if (Array.isArray(parsedCart)) {
              itemsForOrder = parsedCart as CartItem[];
            }
          }
        }
      } catch (error) {
        // Silent error
      }

      if (itemsForOrder.length === 0) {
        showToast("Корзина пуста", "error");
        return null;
      }

      const createdOrder = await createOrderMutation.mutateAsync({
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        phoneNumber: orderData.phoneNumber,
        notes: orderData.notes,
        items: itemsForOrder.map((item) => ({
          flowerId: item.flowerId,
          quantity: item.quantity,
        })),
      });

      if (!createdOrder) {
        showToast("Ошибка при сохранении заказа. Попробуйте еще раз.", "error");
        return null;
      }

      const updatedOrders = [...orders, createdOrder as unknown as Order];
      setOrders(updatedOrders);
      
      // Save to localStorage
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
        }
      } catch (error) {
        // Silent error - localStorage save is not critical
      }

      // Clear cart only after successful order creation
      clearCart();

      showToast("Заказ успешно создан!", "success");
      return createdOrder as unknown as Order;
      
    } catch (error) {
      showToast("Ошибка при создании заказа. Попробуйте еще раз.", "error");
      return null;
    }
  };

  // Get order by ID
  const getOrder = (id: string): Order | undefined => {
    return orders.find((order) => order.id === id);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        getOrder,
        isLoading,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};
