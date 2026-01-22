declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        Haptic: {
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          auth_date: string;
          hash: string;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: "light" | "dark";
        viewport: {
          height: number;
          width: number;
          stable_height: number;
          isExpanded: boolean;
        };
      };
    };
  }
}

export const telegram =
  typeof window !== "undefined" ? window.Telegram?.WebApp : null;

export const initTelegram = () => {
  if (telegram) {
    telegram.ready();
    telegram.expand();

    // Set theme colors
    const root = document.documentElement;
    if (telegram.colorScheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply theme params
    const theme = telegram.themeParams;
    if (theme.bg_color) {
      root.style.setProperty("--tg-bg-color", theme.bg_color);
    }
    if (theme.text_color) {
      root.style.setProperty("--tg-text-color", theme.text_color);
    }
    if (theme.hint_color) {
      root.style.setProperty("--tg-hint-color", theme.hint_color);
    }
    if (theme.button_color) {
      root.style.setProperty("--tg-button-color", theme.button_color);
    }
    if (theme.button_text_color) {
      root.style.setProperty("--tg-button-text-color", theme.button_text_color);
    }
  }
};

export const hapticImpact = (style: "light" | "medium" | "heavy" = "light") => {
  telegram?.Haptic.impactOccurred(style);
};

export const hapticNotification = (type: "error" | "success" | "warning") => {
  telegram?.Haptic.notificationOccurred(type);
};

export const hapticSelection = () => {
  telegram?.Haptic.selectionChanged();
};

export const showMainButton = (text: string, onClick: () => void) => {
  if (telegram) {
    telegram.MainButton.text = text;
    telegram.MainButton.show();
    telegram.MainButton.enable();
    telegram.MainButton.onClick(onClick);
  }
};

export const hideMainButton = () => {
  if (telegram) {
    telegram.MainButton.hide();
  }
};

export const showBackButton = (onClick: () => void) => {
  if (telegram) {
    telegram.BackButton.show();
    telegram.BackButton.onClick(onClick);
  }
};

export const hideBackButton = () => {
  if (telegram) {
    telegram.BackButton.hide();
  }
};
