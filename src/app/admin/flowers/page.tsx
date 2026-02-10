"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "~/components/Header";
import BottomNav from "~/components/BottomNav";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { api } from "~/trpc/react";

export default function AdminFlowersPage() {
  const router = useRouter();
  const { user } = useTelegramAuth();

  const categoriesQuery = api.admin.listCategories.useQuery(undefined, {
    enabled: user?.isAdmin==true,
  });
  const flowersQuery = api.admin.listFlowers.useQuery(undefined, {
    enabled: user?.isAdmin==true,
  });

  const upsertMutation = api.admin.upsertFlower.useMutation({
    onSuccess: () => flowersQuery.refetch(),
  });
  const deleteMutation = api.admin.deleteFlower.useMutation({
    onSuccess: () => flowersQuery.refetch(),
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const attributeOptions = useMemo(
    () => categories.filter((c) => c.type === "ATTRIBUTE"),
    [categories],
  );
  const mainCategories = useMemo(
    () => categories.filter((c) => c.type === "MAIN"),
    [categories],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [attributes, setAttributes] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [deliveryNextDay, setDeliveryNextDay] = useState(false);

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

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("0");
    setImage("");
    setCategoryId("");
    setAttributes([]);
    setInStock(true);
    setDeliveryNextDay(false);
  };

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
      <Header user={user} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">
            Товары
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Цена
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                  Категория
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
                >
                  <option value="">Выберите</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                Изображение
              </label>
              {image && (
                <div className="mb-2">
                  <img
                    src={image}
                    alt="preview"
                    className="h-24 w-24 rounded object-cover border border-brand-200 dark:border-ink-700"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    if (typeof result === "string") {
                      setImage(result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-ink-700 dark:bg-ink-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-2">
                Подкатегории
              </label>
              <div className="flex flex-wrap gap-2">
                {attributeOptions.map((attr) => {
                  const active = attributes.includes(attr.id);
                  return (
                    <button
                      key={attr.id}
                      type="button"
                      onClick={() => {
                        setAttributes((prev) =>
                          active
                            ? prev.filter((id) => id !== attr.id)
                            : [...prev, attr.id],
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                        active
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-brand-100 text-ink-700 border-brand-200 hover:bg-brand-200"
                      }`}
                    >
                      {attr.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">В наличии</span>
              </label>

              <label className="flex items-center gap-3 text-ink-700 dark:text-ink-200">
                <input
                  type="checkbox"
                  checked={deliveryNextDay}
                  onChange={(e) => setDeliveryNextDay(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">Сделаем на заказ</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={upsertMutation.isLoading}
                onClick={() => {
                  upsertMutation.mutate({
                    id: editingId ?? undefined,
                    name,
                    price: Number(price),
                    image,
                    categoryId,
                    attributes,
                    inStock,
                    deliveryNextDay,
                  });
                  resetForm();
                }}
                className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition-colors disabled:bg-ink-300"
              >
                {editingId ? "Сохранить" : "Добавить"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-brand-200 px-4 py-2 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        </div>

        {flowersQuery.isLoading ? (
          <div className="text-ink-600 dark:text-ink-300">Загрузка...</div>
        ) : (
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
              Список товаров
            </h2>
            <div className="space-y-3">
              {(flowersQuery.data ?? []).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded border border-brand-200 p-3 dark:border-ink-700"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900 dark:text-white truncate">
                      {f.name}
                    </div>
                    <div className="text-sm text-ink-600 dark:text-ink-300">
                      {f.price} ₽
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(f.id);
                        setName(f.name);
                        setPrice(String(f.price));
                        setImage(f.image);
                        setCategoryId(f.categoryId);
                        setAttributes(f.attributes ?? []);
                        setInStock(f.inStock);
                        setDeliveryNextDay(f.deliveryNextDay);
                      }}
                      className="rounded border border-brand-200 px-3 py-1 text-ink-700 hover:bg-brand-100 transition-colors dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      disabled={deleteMutation.isLoading}
                      onClick={() => deleteMutation.mutate({ id: f.id })}
                      className="rounded border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 transition-colors dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
