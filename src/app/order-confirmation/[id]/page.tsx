"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { api } from "~/trpc/react";

import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const orderQuery = api.orders.getOrder.useQuery(
    { id: params.id },
    { enabled: !!user },
  );
  const order = orderQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900";
      case "CONFIRMED":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900";
      case "DELIVERED":
        return "text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-ink-800";
      case "CANCELLED":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900";
      default:
        return "text-ink-600 dark:text-ink-300 bg-brand-100 dark:bg-ink-800";
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
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300">
              Пожалуйста, войдите через Telegram для просмотра заказа
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
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

  if (orderQuery.isError) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300 mb-4">
              Ошибка загрузки заказа
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="rounded bg-brand-600 px-6 py-2 text-white hover:bg-brand-700 transition-colors"
            >
              Мои заказы
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300 mb-4">
              Заказ не найден
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded bg-brand-600 px-6 py-2 text-white hover:bg-brand-700 transition-colors"
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
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Success Message */}
        <div className="bg-brand-100 dark:bg-ink-800 border border-brand-200 dark:border-ink-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-brand-700 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-900 dark:text-white">
                Заказ успешно оформлен!
              </h1>
              <p className="text-ink-700 dark:text-ink-200">
                Номер заказа: #{order.id.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
              Детали заказа
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600 dark:text-ink-300">Дата заказа:</span>
              <span className="text-ink-900 dark:text-white">
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
                <span className="text-ink-600 dark:text-ink-300">Адрес доставки:</span>
                <span className="text-ink-900 dark:text-white text-right max-w-xs">
                  {order.deliveryAddress}
                </span>
              </div>
            )}
            
            {order.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-ink-600 dark:text-ink-300">Телефон:</span>
                <span className="text-ink-900 dark:text-white">
                  {order.phoneNumber}
                </span>
              </div>
            )}
            
            {order.notes && (
              <div className="flex justify-between">
                <span className="text-ink-600 dark:text-ink-300">Примечания:</span>
                <span className="text-ink-900 dark:text-white text-right max-w-xs">
                  {order.notes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-ink-900 dark:text-white">
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
                    <div className="font-medium text-ink-900 dark:text-white">
                      {item.flower?.name}
                    </div>
                    <div className="text-sm text-ink-600 dark:text-ink-300">
                      {item.quantity} шт. × {item.price} ₽
                    </div>
                  </div>
                </div>
                <div className="font-medium text-ink-900 dark:text-white">
                  {item.quantity * item.price} ₽
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-200 dark:border-ink-700 mt-4 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-ink-900 dark:text-white">Итого:</span>
              <span className="text-brand-700 dark:text-brand-300">
                {order.totalAmount} ₽
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full rounded bg-brand-600 py-3 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            Продолжить покупки
          </button>
          
          <button
            onClick={() => router.push("/profile")}
            className="w-full rounded border border-brand-200 py-3 text-ink-700 font-medium hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            Мои заказы
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
