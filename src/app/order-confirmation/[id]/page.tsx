"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "~/contexts/OrderContext";
import type { Order } from "~/types";

import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { getOrder, isLoading } = useOrder();
  const order = getOrder(params.id);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900";
      case "CONFIRMED":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900";
      case "DELIVERED":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900";
      case "CANCELLED":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "В обработке";
      case "CONFIRMED":
        return "Подтвержден";
      case "DELIVERED":
        return "Доставлен";
      case "CANCELLED":
        return "Отменен";
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Пожалуйста, войдите через Telegram для просмотра заказа
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Заказ не найден
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 transition-colors"
            >
              На главную
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
        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-900 dark:text-green-100">
                Заказ успешно оформлен!
              </h1>
              <p className="text-green-700 dark:text-green-300">
                Номер заказа: #{order.id.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Детали заказа
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Дата заказа:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {order.deliveryAddress && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Адрес доставки:</span>
                <span className="text-gray-900 dark:text-white text-right max-w-xs">
                  {order.deliveryAddress}
                </span>
              </div>
            )}
            
            {order.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Телефон:</span>
                <span className="text-gray-900 dark:text-white">
                  {order.phoneNumber}
                </span>
              </div>
            )}
            
            {order.notes && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Примечания:</span>
                <span className="text-gray-900 dark:text-white text-right max-w-xs">
                  {order.notes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Состав заказа
          </h2>
          
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {item.flower?.image && (
                    <img
                      src={item.flower.image}
                      alt={item.flower.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.flower?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.quantity} шт. × {item.price} ₽
                    </div>
                  </div>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.quantity * item.price} ₽
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900 dark:text-white">Итого:</span>
              <span className="text-green-600 dark:text-green-400">
                {order.totalAmount} ₽
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full rounded bg-green-600 py-3 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Продолжить покупки
          </button>
          
          <button
            onClick={() => router.push("/profile")}
            className="w-full rounded border border-gray-300 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Мои заказы
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
