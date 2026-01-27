"use client";

import { useEffect, useState } from "react";

interface DebugInfo {
  telegramAvailable: boolean;
  webappAvailable: boolean;
  initData: string | null | 'EMPTY';
  initDataUnsafe: object | null | 'NOT AVAILABLE';
  parsedUser: object | null; // From initData
  unsafeUser: object | null; // From initDataUnsafe.user
  mockUser: object | null; // Fallback user
  error: string | null;
}

export default function TelegramDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    const initialDebugInfo: DebugInfo = {
      telegramAvailable: typeof window !== 'undefined' && !!window.Telegram,
      webappAvailable: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
      initData: 'EMPTY',
      initDataUnsafe: 'NOT AVAILABLE',
      parsedUser: null,
      unsafeUser: null,
      mockUser: {
        id: "1",
        telegramId: "12345",
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        photoUrl: "https://via.placeholder.com/100",
      },
      error: null,
    };

    if (initialDebugInfo.webappAvailable) {
      const tgWebApp = window.Telegram.WebApp;

      initialDebugInfo.initData = tgWebApp.initData || 'EMPTY';
      initialDebugInfo.initDataUnsafe = tgWebApp.initDataUnsafe || 'NOT AVAILABLE';

      try {
        // Attempt to parse initData for user
        if (tgWebApp.initData) {
          const params = new URLSearchParams(tgWebApp.initData);
          const userParam = params.get('user');
          if (userParam) {
            initialDebugInfo.parsedUser = JSON.parse(decodeURIComponent(userParam));
          }
        }
      } catch (e) {
        console.error('Error parsing Telegram initData:', e);
        initialDebugInfo.error = 'Failed to parse initData';
      }

      // Use initDataUnsafe.user as fallback if parsedUser is not available
      if (!initialDebugInfo.parsedUser && tgWebApp.initDataUnsafe?.user) {
        initialDebugInfo.unsafeUser = tgWebApp.initDataUnsafe.user;
      }
    }

    setDebugInfo(initialDebugInfo);

  }, []); // Run once on mount

  if (!debugInfo) {
    return null;
  }

  const isTelegramDataAvailable = debugInfo.parsedUser || debugInfo.unsafeUser || debugInfo.mockUser;

  return (
    <div className="fixed top-0 right-0 bg-blue-500 text-white p-2 text-xs z-50 max-w-xs rounded-bl-lg shadow-lg">
      <div className="font-bold">Telegram Debug Info:</div>
      {!debugInfo.telegramAvailable && (
        <div className="text-yellow-200">Telegram client not detected.</div>
      )}
      {debugInfo.telegramAvailable && !debugInfo.webappAvailable && (
        <div className="text-yellow-200">Telegram WebApp not detected.</div>
      )}
      {debugInfo.webappAvailable && (
        <>
          <div>InitData: {typeof debugInfo.initData === 'string' ? debugInfo.initData : JSON.stringify(debugInfo.initData)}</div>
          <div>InitDataUnsafe: {typeof debugInfo.initDataUnsafe === 'string' ? debugInfo.initDataUnsafe : JSON.stringify(debugInfo.initDataUnsafe)}</div>

          {!isTelegramDataAvailable && !debugInfo.error && (
            <div className="text-yellow-200 mt-1">No Telegram user data available. Falling back to mock.</div>
          )}
          {debugInfo.error && (
            <div className="text-red-300 mt-1">Error: {debugInfo.error}</div>
          )}

          {(debugInfo.parsedUser || debugInfo.unsafeUser || debugInfo.mockUser) && (
            <div className="mt-2 border-t border-blue-300 pt-1">
              <div className="font-bold">Effective User:</div>
              {debugInfo.parsedUser && (
                <div>
                  <div>(Parsed from initData)</div>
                  <div>ID: {debugInfo.parsedUser.id}</div>
                  <div>Name: {debugInfo.parsedUser.first_name} {debugInfo.parsedUser.last_name}</div>
                  <div>@{debugInfo.parsedUser.username}</div>
                </div>
              )}
              {debugInfo.unsafeUser && !debugInfo.parsedUser && (
                <div>
                  <div>(From initDataUnsafe)</div>
                  <div>ID: {debugInfo.unsafeUser.id}</div>
                  <div>Name: {debugInfo.unsafeUser.first_name} {debugInfo.unsafeUser.last_name}</div>
                  <div>@{debugInfo.unsafeUser.username}</div>
                </div>
              )}
              {debugInfo.mockUser && !debugInfo.parsedUser && !debugInfo.unsafeUser && (
                <div>
                  <div>(Mock User)</div>
                  <div>ID: {debugInfo.mockUser.id}</div>
                  <div>Name: {debugInfo.mockUser.firstName} {debugInfo.mockUser.lastName}</div>
                  <div>@{debugInfo.mockUser.username}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}