"use client";

import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { api } from "~/trpc/react";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();

  const ordersQuery = api.admin.listOrders.useQuery(undefined, {
    enabled: !!user?.isAdmin,
  });

  const updateStatusMutation = api.admin.updateOrderStatus.useMutation({
    onSuccess: () => ordersQuery.refetch(),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={null} />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300">
              Пожалуйста, войдите через Telegram
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
        <Header user={user} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="text-lg text-ink-600 dark:text-ink-300 mb-4">
              Доступ запрещён
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="rounded bg-brand-600 px-6 py-2 text-white hover:bg-brand-700 transition-colors"
            >
              В профиль
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
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">
            Заказы
          </h1>
          <button
            onClick={() => router.push("/admin")}
            className="rounded border border-brand-200 px-4 py-2 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            Назад
          </button>
        </div>

        {ordersQuery.isLoading ? (
          <div className="text-ink-600 dark:text-ink-300">Загрузка...</div>
        ) : (
          <div className="space-y-4">
            {(ordersQuery.data ?? []).map((o) => (
              <div
                key={o.id}
                className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-ink-600 dark:text-ink-300">Заказ</div>
                    <div className="text-lg font-semibold text-ink-900 dark:text-white">
                      #{o.id.slice(-8)}
                    </div>
                    <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {new Date(o.createdAt).toLocaleString("ru-RU")}
                    </div>
                    <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      Клиент: {o.user?.firstName} (@{o.user?.username ?? "-"})
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-ink-600 dark:text-ink-300">Сумма</div>
                    <div className="text-xl font-bold text-brand-700 dark:text-brand-300">
                      {o.totalAmount} ₽
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    Телефон: {o.phoneNumber ?? "-"}
                  </div>
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    Адрес: {o.deliveryAddress ?? "-"}
                  </div>
                  {o.notes && (
                    <pre className="whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                      {o.notes}
                    </pre>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-ink-900 dark:text-white">
                    Статус
                  </div>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: o.id,
                        status: e.target.value as (typeof STATUSES)[number],
                      })
                    }
                    className="rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
