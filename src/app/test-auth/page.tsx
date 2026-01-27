"use client";

import { useState } from "react";
import { useTelegramAuth } from "~/hooks/useTelegramAuth";
import { authenticateWithTelegram } from "~/utils/auth";
import Header from "~/components/Header";

export default function TestAuthPage() {
  const { user } = useTelegramAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAuth = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const authResult = await authenticateWithTelegram();
      setResult(authResult);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-ink-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-6">
            Тест аутентификации и базы данных
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Текущий пользователь:
              </h2>
              <pre className="text-sm text-blue-800 dark:text-blue-200">
                {user ? JSON.stringify(user, null, 2) : "Пользователь не загружен"}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={testAuth}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Загрузка..." : "Тест аутентификации"}
              </button>
              
              <button
                onClick={checkDatabase}
                disabled={loading}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? "Загрузка..." : "Проверить базу данных"}
              </button>
            </div>

            {result && (
              <div className="p-4 bg-brand-50 dark:bg-ink-700 rounded-lg">
                <h2 className="font-semibold text-ink-900 dark:text-white mb-2">
                  Результат:
                </h2>
                <pre className="text-sm text-ink-800 dark:text-ink-200 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
