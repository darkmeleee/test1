"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initTelegram } from "~/utils/telegram";
import type { User, CartItem } from "~/types";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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
      // No Telegram data, use mock user
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  const totalSpent = cartItems.reduce((sum, item) => sum + (item.flower?.price || 0) * item.quantity, 0);
  const totalOrders = cartItems.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            {user.photoUrl && (
              <img
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName || ""}`}
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName || ""}
              </h1>
              {user.username && (
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Telegram ID: {user.telegramId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalOrders}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Заказы</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Товаров в корзине</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {totalSpent} ₽
            </div>
            <div className="text-gray-600 dark:text-gray-400">Сумма корзины</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Текущая корзина
          </h2>
          
          {cartItems.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Ваша корзина пуста
            </p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex items-center space-x-4">
                    {item.flower?.image && (
                      <img
                        src={item.flower.image}
                        alt={item.flower.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.flower?.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} шт. × {item.flower?.price} ₽
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {(item.flower?.price || 0) * item.quantity} ₽
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Итого:
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {totalSpent} ₽
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
