"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { api } from "~/trpc/react";

type CategoryType = "MAIN" | "ATTRIBUTE";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();

  const categoriesQuery = api.admin.listCategories.useQuery(undefined, {
    enabled: !!user?.isAdmin,
  });

  const upsertMutation = api.admin.upsertCategory.useMutation({
    onSuccess: () => categoriesQuery.refetch(),
  });

  const deleteMutation = api.admin.deleteCategory.useMutation({
    onSuccess: () => categoriesQuery.refetch(),
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("MAIN");
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  const grouped = useMemo(() => {
    return {
      MAIN: categories.filter((c) => c.type === "MAIN"),
      ATTRIBUTE: categories.filter((c) => c.type === "ATTRIBUTE"),
    };
  }, [categories]);

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
            Категории
          </h1>
          <button
            onClick={() => router.push("/admin")}
            className="rounded border border-brand-200 px-4 py-2 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            Назад
          </button>
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                Название
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
                placeholder="Например, Экзотика"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                Тип
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CategoryType)}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
              >
                <option value="MAIN">Категория</option>
                <option value="ATTRIBUTE">Подкатегория</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={upsertMutation.isLoading}
                onClick={() => {
                  upsertMutation.mutate({ id: editingId ?? undefined, name, type });
                  setName("");
                  setType("MAIN");
                  setEditingId(null);
                }}
                className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition-colors disabled:bg-ink-300"
              >
                {editingId ? "Сохранить" : "Добавить"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    setType("MAIN");
                    setEditingId(null);
                  }}
                  className="rounded border border-brand-200 px-4 py-2 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        </div>

        {categoriesQuery.isLoading ? (
          <div className="text-ink-600 dark:text-ink-300">Загрузка...</div>
        ) : (
          <div className="grid gap-6">
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
                Категории
              </h2>
              <div className="space-y-3">
                {grouped.MAIN.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded border border-brand-200 p-3 dark:border-ink-700"
                  >
                    <div className="text-ink-900 dark:text-white">{c.name}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setName(c.name);
                          setType("MAIN");
                        }}
                        className="rounded border border-brand-200 px-3 py-1 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        disabled={deleteMutation.isLoading}
                        onClick={() => deleteMutation.mutate({ id: c.id })}
                        className="rounded border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 transition-colors dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
                Подкатегории
              </h2>
              <div className="space-y-3">
                {grouped.ATTRIBUTE.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded border border-brand-200 p-3 dark:border-ink-700"
                  >
                    <div className="text-ink-900 dark:text-white">{c.name}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setName(c.name);
                          setType("ATTRIBUTE");
                        }}
                        className="rounded border border-brand-200 px-3 py-1 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        disabled={deleteMutation.isLoading}
                        onClick={() => deleteMutation.mutate({ id: c.id })}
                        className="rounded border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 transition-colors dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
