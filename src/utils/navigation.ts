import { useRouter } from "next/navigation";

export const useTelegramNavigation = () => {
  const router = useRouter();

  const navigate = (href: string) => {
    console.log("Navigation requested to:", href);

    // Add haptic feedback if in Telegram WebApp
    if (
      typeof window !== "undefined" &&
      (window as any).Telegram?.WebApp?.Haptic?.impactOccurred
    ) {
      try {
        (window as any).Telegram.WebApp.Haptic.impactOccurred("light");
        console.log("Haptic feedback triggered");
      } catch (error) {
        console.log("Haptic feedback failed:", error);
      }
    }

    // Use Next.js router for navigation
    try {
      router.push(href);
      console.log("Router push successful for:", href);
    } catch (error) {
      console.error("Router push failed for:", href, error);

      // Fallback to window.location if router fails
      if (typeof window !== "undefined") {
        window.location.href = href;
        console.log("Fallback navigation using window.location");
      }
    }
  };

  return { navigate };
};
