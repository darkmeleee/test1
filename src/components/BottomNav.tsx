"use client";

import { Home, ShoppingBag, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => router.push("/")}
            className="flex flex-col items-center p-2 text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Главная</span>
          </button>
          
          <button 
            onClick={() => router.push("/cart")}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="text-xs mt-1">Корзина</span>
          </button>
          
          <button 
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <UserIcon className="h-6 w-6" />
            <span className="text-xs mt-1">Профиль</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
