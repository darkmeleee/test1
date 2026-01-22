"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState("");

  const seedCategories = api.flowers.createInitialCategories.useMutation();
  const seedFlowers = api.flowers.createInitialFlowers.useMutation();

  const handleSeedData = async () => {
    setIsSeeding(true);
    setMessage("Начинаем сидирование данных...");

    try {
      // Seed categories first
      await seedCategories.mutateAsync();
      setMessage("Категории успешно созданы!");

      // Then seed flowers
      await seedFlowers.mutateAsync();
      setMessage("Данные успешно загружены! 🌸");

    } catch (error) {
      console.error("Seeding error:", error);
      setMessage("Ошибка при загрузке данных");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Инициализация данных
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Нажмите кнопку ниже для загрузки начальных данных о цветах и категориях в базу данных.
        </p>

        <button
          onClick={handleSeedData}
          disabled={isSeeding}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSeeding ? "Загрузка..." : "Загрузить данные"}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes("Ошибка") 
              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" 
              : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            После загрузки данных перейдите на главную страницу для просмотра каталога.
          </p>
        </div>
      </div>
    </div>
  );
}
