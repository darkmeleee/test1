"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { hapticImpact } from "~/utils/telegram";
import type { CartItem, Order } from "~/types";

import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Initialize user with Telegram WebApp data
  useEffect(() => {
    const telegramData = window.Telegram?.WebApp?.initData;
    if (telegramData) {
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

  // Get cart items
  const { data: cartData, isLoading } = api.flowers.getCart.useQuery(
    { userId: user?.id || "" },
    { enabled: !!user }
  );

  // Create order mutation
  const createOrderMutation = api.orders.createOrder.useMutation({
    onSuccess: (order: any) => {
      hapticImpact('heavy');
      router.push(`/order-confirmation/${order.id}`);
    },
    onError: (error) => {
      hapticImpact('medium');
      console.error("Failed to create order:", error);
      alert("Ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.");
    },
  });

  // Update cart items when data changes
  useEffect(() => {
    if (cartData) {
      const transformedCartData = cartData.map(item => ({
        ...item,
        flower: item.flower ? {
          ...item.flower,
          attributes: JSON.parse(item.flower.attributesJson || "[]") as string[],
        } : undefined,
      }));
      setCartItems(transformedCartData);
    }
  }, [cartData]);

  // Calculate totals
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.flower?.price || 0) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || cartItems.length === 0) return;
    
    setIsSubmitting(true);
    hapticImpact('medium');
    
    try {
      await createOrderMutation.mutateAsync({
        deliveryAddress,
        phoneNumber,
        notes,
      });
    } catch (error) {
      console.error("Order submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Пожалуйста, войдите через Telegram для оформления заказа
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-lg">Загрузка...</div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Ваша корзина пуста
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 transition-colors"
            >
              Перейти к покупкам
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Оформление заказа
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Состав заказа
            </h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.flower?.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(item.flower?.price || 0) * item.quantity} ₽
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Итого:</span>
                  <span className="text-green-600 dark:text-green-400">{cartTotal} ₽</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Информация о доставке
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Адрес доставки
                </label>
                <textarea
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Укажите адрес доставки..."
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Телефон для связи
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Примечания к заказу
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Особые пожелания..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-green-600 py-3 text-white font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Оформление..." : "Подтвердить заказ"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
