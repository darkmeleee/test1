"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { api } from "~/trpc/react";

export default function AdminConfigPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();

  const configQuery = api.config.getConfig.useQuery(undefined, {
    enabled: !!user?.isAdmin,
  });

  const setDeliveryFeeMutation = api.config.setDeliveryFee.useMutation({
    onSuccess: () => configQuery.refetch(),
  });

  const [deliveryFee, setDeliveryFee] = useState("500");

  useEffect(() => {
    if (typeof configQuery.data?.deliveryFee === "number") {
      setDeliveryFee(String(configQuery.data.deliveryFee));
    }
  }, [configQuery.data?.deliveryFee]);

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

  if (user.isAdmin == false) {
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
            Настройки
          </h1>
          <button
            onClick={() => router.push("/admin")}
            className="rounded border border-brand-200 px-4 py-2 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            Назад
          </button>
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                Стоимость доставки (₽)
              </label>
              <input
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
              />
            </div>

            <button
              type="button"
              disabled={setDeliveryFeeMutation.isLoading}
              onClick={() => {
                const parsed = Number(deliveryFee);
                if (!Number.isFinite(parsed) || parsed < 0) return;
                setDeliveryFeeMutation.mutate({ deliveryFee: parsed });
              }}
              className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition-colors disabled:bg-ink-300"
            >
              Сохранить
            </button>

            {configQuery.isLoading && (
              <div className="text-sm text-ink-600 dark:text-ink-300">Загрузка...</div>
            )}

            {configQuery.isError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                Не удалось загрузить настройки
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
