"use client";

import { Home, ShoppingBag, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTelegramNavigation } from "~/utils/navigation";

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

export default function BottomNav() {
  const pathname = usePathname();
  const { navigate } = useTelegramNavigation();

  const navItems: NavItem[] = [
    {
      name: 'Главная',
      href: '/',
      icon: <Home className="h-6 w-6" />,
    },
    {
      name: 'Корзина',
      href: '/cart',
      icon: <ShoppingBag className="h-6 w-6" />,
    },
    {
      name: 'Профиль',
      href: '/profile',
      icon: <UserIcon className="h-6 w-6" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Add haptic feedback if in Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.Haptic?.impactOccurred) {
      try {
        (window as any).Telegram.WebApp.Haptic.impactOccurred('light');
      } catch (error) {
        // Silent error
      }
    }

    // Use direct window.location for more reliable navigation in Telegram WebApp
    try {
      window.location.href = href;
    } catch (error) {
      // Fallback to Next.js router
      navigate(href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-50 border-t border-brand-200 dark:bg-ink-900 dark:border-ink-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavigation(item.href, e)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  active
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-ink-600 hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
