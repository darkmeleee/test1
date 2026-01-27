"use client";

import { useState, useEffect } from "react";
import { initTelegram } from "~/utils/telegram";
import { authenticateWithTelegram } from "~/utils/auth";
import type { User } from "~/types";

export function useTelegramAuth() {
  const [user, setUser] = useState<User | null>(null);

  // Function to get user data directly from Telegram WebApp
  const getUserFromWebApp = () => {
    try {
      console.log('getUserFromWebApp called');
      
      if (typeof window === 'undefined') {
        console.log('Window is not available (server-side rendering)');
        return null;
      }
      
      // Log all available Telegram WebApp data for debugging
      console.log('Telegram object exists:', !!window.Telegram);
      console.log('WebApp object exists:', !!window.Telegram?.WebApp);
      console.log('initData exists:', !!window.Telegram?.WebApp?.initData);
      console.log('initDataUnsafe exists:', !!window.Telegram?.WebApp?.initDataUnsafe);
      
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Found user in initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe.user);
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return {
          id: user.id?.toString() || 'no-id',
          telegramId: user.id?.toString() || 'no-telegram-id',
          firstName: user.first_name || 'No',
          lastName: user.last_name,
          username: user.username || 'nousername',
          photoUrl: user.photo_url || ''
        };
      } else {
        console.log('No user in initDataUnsafe');
      }
      
      // Fallback to parsing initData directly
      if (window.Telegram?.WebApp?.initData) {
        console.log('initData exists, trying to parse it');
        try {
          const params = new URLSearchParams(window.Telegram.WebApp.initData);
          const userParam = params.get('user');
          console.log('User param from initData:', userParam);
          
          if (userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            console.log('Parsed user from initData:', user);
            return {
              id: user.id?.toString() || 'no-id',
              telegramId: user.id?.toString() || 'no-telegram-id',
              firstName: user.first_name || 'No',
              lastName: user.last_name,
              username: user.username || 'nousername',
              photoUrl: user.photo_url || ''
            };
          }
        } catch (e) {
          console.error('Error parsing initData:', e);
        }
      } else {
        console.log('initData is not available');
      }
      
      console.log('No user data found in WebApp');
      return null;
    } catch (error) {
      console.error('Error in getUserFromWebApp:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Starting Telegram authentication...');
    
    const initAuth = () => {
      try {
        console.log('Initializing Telegram WebApp...');
        initTelegram();
        
        // Debug: Log all available window properties
        console.log('Window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('telegram')));
        
        // Try to get user directly from WebApp first
        console.log('Trying to get user from WebApp...');
        const webAppUser = getUserFromWebApp();
        
        if (webAppUser) {
          console.log('✅ Successfully got user from WebApp:', webAppUser);
          setUser(webAppUser);
          return;
        }
        
        console.log('❌ Could not get user from WebApp, trying API authentication...');
        
        // Fallback to API authentication if WebApp data is not available
        authenticateWithTelegram()
          .then((userData) => {
            console.log('API authentication response:', userData);
            if (userData?.success && userData?.user) {
              console.log('✅ Using user from API:', userData.user);
              setUser(userData.user);
            } else {
              console.error('❌ Authentication failed: No user data received from API');
              // Show debug info in the UI
              setUser({
                id: 'debug-mode',
                telegramId: 'debug-telegram-id',
                firstName: 'Debug',
                lastName: 'Mode',
                username: 'debug_user',
                photoUrl: ''
              });
            }
          })
          .catch((error) => {
            console.error('❌ Authentication error:', error);
          });
          
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };
    
    // Try to initialize immediately
    console.log('Starting initialization...');
    initAuth();
    
    // Also set up a retry mechanism in case Telegram WebApp loads after our initial attempt
    const maxRetries = 5;
    let retryCount = 0;
    
    const retryInterval = setInterval(() => {
      if (user) {
        console.log('User data loaded, clearing retry interval');
        clearInterval(retryInterval);
        return;
      }
      
      if (retryCount >= maxRetries) {
        console.log('Max retries reached, giving up');
        clearInterval(retryInterval);
        return;
      }
      
      console.log(`Retry ${retryCount + 1}/${maxRetries} to get Telegram data...`);
      initAuth();
      retryCount++;
    }, 1000);
    
    return () => {
      clearInterval(retryInterval);
    };
  }, [user]);

  return { user };
}
