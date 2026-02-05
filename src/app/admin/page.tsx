"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();

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
        <h1 className="text-2xl font-bold mb-6 text-ink-900 dark:text-white">
          Админ панель
        </h1>

        <div className="grid gap-4">
          <Link
            href="/admin/categories"
            className="block rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-100 dark:bg-ink-800 dark:hover:bg-ink-700"
          >
            <div className="font-semibold text-ink-900 dark:text-white">Категории</div>
            <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Изменение категорий и подкатегорий
            </div>
          </Link>

          <Link
            href="/admin/flowers"
            className="block rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-100 dark:bg-ink-800 dark:hover:bg-ink-700"
          >
            <div className="font-semibold text-ink-900 dark:text-white">Товары</div>
            <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Добавление/изменение/удаление карточек
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="block rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-100 dark:bg-ink-800 dark:hover:bg-ink-700"
          >
            <div className="font-semibold text-ink-900 dark:text-white">Заказы</div>
            <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Список заказов
            </div>
          </Link>

          <Link
            href="/admin/config"
            className="block rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-100 dark:bg-ink-800 dark:hover:bg-ink-700"
          >
            <div className="font-semibold text-ink-900 dark:text-white">Настройки</div>
            <div className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Стоимость доставки
            </div>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
