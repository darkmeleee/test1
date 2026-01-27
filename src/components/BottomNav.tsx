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
    
    console.log('Navigating to:', href);
    
    // Add haptic feedback if in Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.Haptic?.impactOccurred) {
      try {
        (window as any).Telegram.WebApp.Haptic.impactOccurred('light');
        console.log('Haptic feedback triggered');
      } catch (error) {
        console.log('Haptic feedback failed:', error);
      }
    }

    // Use direct window.location for more reliable navigation in Telegram WebApp
    try {
      window.location.href = href;
      console.log('Navigation using window.location to:', href);
    } catch (error) {
      console.error('Window.location navigation failed:', error);
      // Fallback to Next.js router
      navigate(href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-50">
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
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
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
