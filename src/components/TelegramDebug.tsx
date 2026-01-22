"use client";

import { useEffect, useState } from "react";

export default function TelegramDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const info = {
          windowExists: true,
          telegramExists: !!window.Telegram,
          webappExists: !!window.Telegram?.WebApp,
          initData: window.Telegram?.WebApp?.initData || 'EMPTY',
          initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe || 'EMPTY',
          user: window.Telegram?.WebApp?.initDataUnsafe?.user || null,
          realUser: window.Telegram?.WebApp?.initData ? 
            (() => {
              try {
                const params = new URLSearchParams(window.Telegram.WebApp.initData);
                const userParam = params.get('user');
                return userParam ? JSON.parse(decodeURIComponent(userParam)) : null;
              } catch {
                return null;
              }
            })() : null
        };
        setDebugInfo(info);
        
        if (window.Telegram?.WebApp?.initData?.user) {
          clearInterval(checkInterval);
        }
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  if (!debugInfo) return null;

  return (
    <div className="fixed top-0 right-0 bg-red-500 text-white p-2 text-xs z-50 max-w-xs">
      <div className="font-bold">Telegram Debug:</div>
      <div>Window: {debugInfo.windowExists ? '✓' : '✗'}</div>
      <div>Telegram: {debugInfo.telegramExists ? '✓' : '✗'}</div>
      <div>WebApp: {debugInfo.webappExists ? '✓' : '✗'}</div>
      <div>initData: {debugInfo.initData === 'EMPTY' ? 'EMPTY' : 'HAS DATA'}</div>
      <div>initDataUnsafe: {debugInfo.initDataUnsafe === 'EMPTY' ? 'EMPTY' : 'HAS DATA'}</div>
      <div>Real User: {debugInfo.realUser ? '✓' : '✗'}</div>
      {debugInfo.realUser && (
        <div className="mt-2">
          <div className="font-bold">Real User:</div>
          <div>ID: {debugInfo.realUser.id}</div>
          <div>Name: {debugInfo.realUser.first_name} {debugInfo.realUser.last_name}</div>
          <div>@{debugInfo.realUser.username}</div>
        </div>
      )}
      {debugInfo.user && !debugInfo.realUser && (
        <div className="mt-2 text-yellow-200">
          <div className="font-bold">Unsafe User (Mock):</div>
          <div>ID: {debugInfo.user.id}</div>
          <div>Name: {debugInfo.user.first_name} {debugInfo.user.last_name}</div>
          <div>@{debugInfo.user.username}</div>
        </div>
      )}
    </div>
  );
}
