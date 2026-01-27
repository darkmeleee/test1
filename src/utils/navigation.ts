import { useRouter } from "next/navigation";

export const useTelegramNavigation = () => {
  const router = useRouter();

  const navigate = (href: string) => {
    // Add haptic feedback if in Telegram WebApp
    if (
      typeof window !== "undefined" &&
      (window as any).Telegram?.WebApp?.Haptic
    ) {
      try {
        (window as any).Telegram.WebApp.Haptic.impactOccurred("light");
      } catch (error) {
        // Silent error
      }
    }

    // Use Next.js router for navigation
    try {
      router.push(href);
    } catch (error) {
      // Fallback to window.location if router fails
      if (typeof window !== "undefined") {
        window.location.href = href;
      }
    }
  };

  return { navigate };
};
