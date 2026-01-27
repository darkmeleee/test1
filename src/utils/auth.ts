import { api } from "~/trpc/react";

export const authenticateWithTelegram = async () => {
  const telegramData = window.Telegram?.WebApp?.initData;

  if (!telegramData) {
    return null;
  }

  try {
    const result = await (api.auth as any).mutateAsync({
      initData: telegramData,
    });

    if (!result?.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    return null;
  }
};
