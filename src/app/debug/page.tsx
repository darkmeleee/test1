"use client";

import { useState, useEffect } from "react";
import Header from "~/components/Header";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check Telegram WebApp availability
    const telegramDebug = {
      telegram: !!window.Telegram,
      webApp: !!window.Telegram?.WebApp,
      initData: window.Telegram?.WebApp?.initData || "EMPTY",
      initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe || "EMPTY",
    };

    setDebugInfo(telegramDebug);
    setUser({
      telegramId: telegramDebug.initDataUnsafe?.user?.id || "N/A",
      firstName: telegramDebug.initDataUnsafe?.user?.first_name || "N/A",
      username: telegramDebug.initDataUnsafe?.user?.username || "N/A",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Debug Telegram WebApp
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Telegram WebApp Status:</h2>
              <pre className="text-sm text-gray-700 dark:text-gray-300">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded">
              <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">User Info:</h2>
              <pre className="text-sm text-blue-700 dark:text-blue-300">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
