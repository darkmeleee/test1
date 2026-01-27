"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Order, OrderItem } from "~/types";
import { useCart } from "./CartContext";

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
        console.error("Error loading orders from localStorage:", error);
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
        console.error("Error saving orders to localStorage:", error);
      }
    }
  }, [orders, isLoading]);

  // Create order from cart
  const createOrder = async (orderData: {
    deliveryAddress?: string;
    phoneNumber?: string;
    notes?: string;
  }): Promise<Order | null> => {
    if (cartItems.length === 0) {
      console.error("Cart is empty");
      return null;
    }

    try {
      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.flower?.price || 0) * item.quantity,
        0
      );

      // Create order items
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        id: `${Date.now()}-${Math.random()}`,
        orderId: `${Date.now()}`,
        flowerId: item.flowerId,
        quantity: item.quantity,
        price: item.flower?.price || 0,
        flower: item.flower,
        createdAt: new Date(),
      }));

      // Create order
      const newOrder: Order = {
        id: `${Date.now()}`,
        userId: "local",
        totalAmount,
        status: "PENDING",
        deliveryAddress: orderData.deliveryAddress,
        phoneNumber: orderData.phoneNumber,
        notes: orderData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: orderItems,
      };

      // Add order to state
      setOrders((prevOrders) => [newOrder, ...prevOrders]);

      // Clear cart
      clearCart();

      return newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
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
