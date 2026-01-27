"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Order, OrderItem } from "~/types";
import { useCart } from "./CartContext";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { useToast } from "~/hooks/useToast";

interface OrderContextType {
  orders: Order[];
  createOrder: (orderData: {
    deliveryAddress?: string;
    phoneNumber?: string;
    notes?: string;
  }) => Promise<Order | null>;
  getOrder: (id: string) => Order | undefined;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = "seva-flowers-orders";

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { items: cartItems, clearCart } = useCart();
  const { user } = useTelegramAuth();
  const { showToast } = useToast();

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
    deliveryAddress?: string;
    phoneNumber?: string;
    notes?: string;
  }): Promise<Order | null> => {
    try {
      if (cartItems.length === 0) {
        showToast("Корзина пуста", "error");
        return null;
      }

      // Generate order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.flower?.price || 0) * item.quantity,
        0
      );

      // Create order items
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        id: `order_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        flowerId: item.flowerId,
        quantity: item.quantity,
        price: item.flower?.price || 0,
        flower: item.flower,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Create order object
      const newOrder: Order = {
        id: orderId,
        userId: user?.id || 'unknown',
        totalAmount,
        status: "PENDING",
        deliveryAddress: orderData.deliveryAddress,
        phoneNumber: orderData.phoneNumber,
        notes: orderData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: orderItems,
      };

      // Try to save to database via API first
      let databaseSaveSuccess = false;
      try {
        const response = await fetch('/api/trpc/orders.createOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              deliveryAddress: orderData.deliveryAddress,
              phoneNumber: orderData.phoneNumber,
              notes: orderData.notes,
            }
          }),
        });

        if (response.ok) {
          databaseSaveSuccess = true;
        }
      } catch (error) {
        databaseSaveSuccess = false;
      }

      // If database save failed, show error and don't save locally or clear cart
      if (!databaseSaveSuccess) {
        showToast("Ошибка при сохранении заказа. Попробуйте еще раз.", "error");
        return null;
      }

      // Only save to localStorage and clear cart if database save was successful
      const updatedOrders = [...orders, newOrder];
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
      return newOrder;
      
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
