"use client";

import { useRouter } from "next/navigation";
import { useOrder } from "~/contexts/OrderContext";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import type { Order } from "~/types";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";
import { api } from "~/trpc/react";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useTelegramAuth();
  const { orders, isLoading } = useOrder();

  const hasDbUser = !!user?.id && user.id !== user.telegramId;

  const profileQuery = api.auth.getProfile.useQuery(
    { userId: user?.id ?? "" },
    { enabled: hasDbUser },
  );

  const profileUser = profileQuery.data
    ? {
        id: profileQuery.data.id,
        telegramId: profileQuery.data.telegramId,
        username: profileQuery.data.username,
        firstName: profileQuery.data.firstName,
        lastName: profileQuery.data.lastName,
        photoUrl: profileQuery.data.photoUrl,
      }
    : null;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 dark:bg-ink-900 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm dark:bg-ink-800">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-ink-900 dark:text-white">Загрузка профиля</h2>
          <p className="text-ink-600 dark:text-ink-300">Пожалуйста, подождите...</p>
        </div>
      </div>
    );
  }

  if (!hasDbUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 dark:bg-ink-900 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm dark:bg-ink-800">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-ink-900 dark:text-white">Авторизация</h2>
          <p className="text-ink-600 dark:text-ink-300">
            Пожалуйста, подождите...
          </p>
        </div>
      </div>
    );
  }

  if (profileQuery.isLoading || !profileUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 dark:bg-ink-900 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm dark:bg-ink-800">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-ink-900 dark:text-white">Загрузка профиля</h2>
          <p className="text-ink-600 dark:text-ink-300">Пожалуйста, подождите...</p>
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 dark:bg-ink-900 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm dark:bg-ink-800">
          <h2 className="mb-2 text-xl font-semibold text-ink-900 dark:text-white">Ошибка загрузки профиля</h2>
          <p className="text-ink-600 dark:text-ink-300">Попробуйте перезапустить приложение.</p>
        </div>
      </div>
    );
  }

  // Separate active orders (PENDING, CONFIRMED) from completed orders
  const activeOrders = orders.filter(order => order.status === 'PENDING' || order.status === 'CONFIRMED');
  const orderHistory = orders.filter(order => order.status === 'DELIVERED' || order.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
      <Header user={profileUser} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            {profileUser.photoUrl && (
              <img
                src={profileUser.photoUrl}
                alt={`${profileUser.firstName}`}
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-ink-900 dark:text-white">
                {profileUser.firstName}
              </h1>
              {profileUser.username && (
                <p className="text-ink-600 dark:text-ink-300">@{profileUser.username}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Telegram ID: {profileUser.telegramId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-4">
            Активный заказ
          </h2>
          
          {activeOrders.length === 0 ? (
            <p className="text-ink-600 dark:text-ink-300">
              У вас нет активных заказов
            </p>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="border border-brand-200 dark:border-ink-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-ink-900 dark:text-white">
                        Заказ #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-ink-600 dark:text-ink-300">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-brand-700 dark:text-brand-300">
                        {order.totalAmount} ₽
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900' :
                        'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900'
                      }`}>
                        {order.status === 'PENDING' ? 'В обработке' : 'Подтвержден'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    {order.items?.length} {order.items?.length === 1 ? 'товар' : order.items?.length === 2 || order.items?.length === 3 || order.items?.length === 4 ? 'товара' : 'товаров'}
                  </div>
                  
                  <button
                    onClick={() => router.push(`/order-confirmation/${order.id}`)}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Посмотреть детали
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-4">
            История заказов
          </h2>
          
          {orderHistory.length === 0 ? (
            <p className="text-ink-600 dark:text-ink-300">
              У вас пока нет завершенных заказов
            </p>
          ) : (
            <div className="space-y-4">
              {orderHistory.map((order) => (
                <div key={order.id} className="border border-brand-200 dark:border-ink-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-ink-900 dark:text-white">
                        Заказ #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-ink-600 dark:text-ink-300">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-brand-700 dark:text-brand-300">
                        {order.totalAmount} ₽
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'DELIVERED' ? 'text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-ink-800' :
                        'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
                      }`}>
                        {order.status === 'DELIVERED' ? 'Доставлен' : 'Отменен'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    {order.items?.length} {order.items?.length === 1 ? 'товар' : order.items?.length === 2 || order.items?.length === 3 || order.items?.length === 4 ? 'товара' : 'товаров'}
                  </div>
                  
                  <button
                    onClick={() => router.push(`/order-confirmation/${order.id}`)}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Посмотреть детали
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
