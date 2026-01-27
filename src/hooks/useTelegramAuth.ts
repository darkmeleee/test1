"use client";

import { useState, useEffect, useRef } from "react";
import { initTelegram } from "~/utils/telegram";
import { authenticateWithTelegram } from "~/utils/auth";
import type { User } from "~/types";

const USER_STORAGE_KEY = "seva-flowers-user";

export function useTelegramAuth() {
  const [user, setUser] = useState<User | null>(null);
  const isInitialized = useRef(false);

  // Function to save user to localStorage
  const saveUserToStorage = (userData: User) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      // Silent error
    }
  };

  // Function to load user from localStorage
  const loadUserFromStorage = (): User | null => {
    try {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          return JSON.parse(storedUser);
        }
      }
    } catch (error) {
      // Silent error
    }
    return null;
  };

  // Function to get user data directly from Telegram WebApp
  const getUserFromWebApp = () => {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        const userData = {
          id: user.id?.toString() || "no-id",
          telegramId: user.id?.toString() || "no-telegram-id",
          firstName: user.first_name || "No",
          lastName: user.last_name,
          username: user.username || "nousername",
          photoUrl: user.photo_url || "",
        };
        saveUserToStorage(userData);
        return userData;
      }

      // Fallback to parsing initData directly
      if (window.Telegram?.WebApp?.initData) {
        try {
          const params = new URLSearchParams(window.Telegram.WebApp.initData);
          const userParam = params.get("user");

          if (userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            const userData = {
              id: user.id?.toString() || "no-id",
              telegramId: user.id?.toString() || "no-telegram-id",
              firstName: user.first_name || "No",
              lastName: user.last_name,
              username: user.username || "nousername",
              photoUrl: user.photo_url || "",
            };
            saveUserToStorage(userData);
            return userData;
          }
        } catch (e) {
          // Silent error
        }
      }

      return null;
    } catch (error) {
      // Silent error
      return null;
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initAuth = () => {
      try {
        initTelegram();

        // First, try to load from localStorage
        const storedUser = loadUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          return;
        }

        // Try to get user directly from WebApp first
        const webAppUser = getUserFromWebApp();

        if (webAppUser) {
          setUser(webAppUser);
          // Removed the API authentication call
          return;
        }

        // Fallback to API authentication if WebApp data is not available
        authenticateWithTelegram()
          .then((userData) => {
            if (userData?.success && userData?.user) {
              setUser(userData.user);
              saveUserToStorage(userData.user);
            } else {
              // Show debug info in the UI
              const debugUser = {
                id: "debug-mode",
                telegramId: "debug-telegram-id",
                firstName: "Debug",
                lastName: "Mode",
                username: "debug_user",
                photoUrl: "",
              };
              setUser(debugUser);
              saveUserToStorage(debugUser);
            }
          })
          .catch((error) => {
            // Show debug info in the UI
            const debugUser = {
              id: "debug-mode",
              telegramId: "debug-telegram-id",
              firstName: "Debug",
              lastName: "Mode",
              username: "debug_user",
              photoUrl: "",
            };
            setUser(debugUser);
            saveUserToStorage(debugUser);
          });
      } catch (error) {
        // Silent error
      }
    };

    // Try to initialize immediately
    initAuth();

    // Also set up a retry mechanism in case Telegram WebApp loads after our initial attempt
    const maxRetries = 3;
    let retryCount = 0;

    const retryInterval = setInterval(() => {
      if (retryCount >= maxRetries) {
        clearInterval(retryInterval);
        return;
      }

      initAuth();
      retryCount++;
    }, 2000);

    return () => {
      clearInterval(retryInterval);
    };
  }, []); // Empty dependency array - only run once

  return { user };
}
