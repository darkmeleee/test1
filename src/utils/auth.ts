import { api } from "~/trpc/react";

export const authenticateWithTelegram = async () => {
  const telegramData = window.Telegram?.WebApp?.initData;
  console.log("Auth - Telegram data available:", !!telegramData);

  if (!telegramData) {
    const errorMsg = "Auth - No Telegram data available";
    console.log(errorMsg);
    return null;
  }

  try {
    console.log("Auth - Calling authentication API...");
    const result = await (api.auth as any).mutateAsync({
      initData: telegramData,
    });

    console.log("Auth - Authentication result:", result);

    if (!result?.data) {
      console.error("Auth - No data in API response");
      return null;
    }

    return result.data;
  } catch (error) {
    const errorMsg = `Auth - Authentication error: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return null;
  }
};
