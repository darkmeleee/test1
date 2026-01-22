"use client";

import { useEffect } from "react";

export default function TelegramLoader() {
  useEffect(() => {
    // Load Telegram WebApp SDK
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      console.log("Telegram WebApp SDK loaded");
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
