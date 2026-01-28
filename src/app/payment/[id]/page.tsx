"use client";

import { useRouter } from "next/navigation";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { api } from "~/trpc/react";

import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useTelegramAuth();

  const orderQuery = api.orders.getOrder.useQuery(
    { id: params.id },
    { enabled: !!user },
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300">
              Пожалуйста, войдите через Telegram для оплаты заказа
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

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300 mb-4">
              Не удалось загрузить заказ
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

  const order = orderQuery.data;

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
      <Header user={user} />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-ink-900 dark:text-white">
          Оплата
        </h1>

        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-ink-600 dark:text-ink-300">Заказ</div>
              <div className="text-lg font-semibold text-ink-900 dark:text-white">
                #{order.id.slice(-8)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-ink-600 dark:text-ink-300">К оплате</div>
              <div className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                {order.totalAmount} ₽
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-ink-600 dark:text-ink-300">
            Статус: {order.status}
          </div>
        </div>

        <button
          onClick={() => {
            router.push(`/order-confirmation/${order.id}`);
          }}
          className="w-full rounded bg-brand-600 py-3 text-white font-medium hover:bg-brand-700 transition-colors"
        >
          Оплатить
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="mt-3 w-full rounded border border-brand-200 py-3 text-ink-700 font-medium hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
        >
          Вернуться в профиль
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
